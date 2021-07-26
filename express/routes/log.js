const express = require('express');
const router = express.Router();

const { badRequest } = require('@helper/customError');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Redis = require('ioredis');
const { REDIS_ADDRESS } = process.env;
const redis = new Redis(REDIS_ADDRESS);

const get_logs = async (projectName, cnt, array = []) => {
	if (cnt === 0) return array;
	
	const data = await redis.lpop(projectName);

	array.push(data);
	return get_logs(projectName, cnt - 1, array);
}

const log_sync = async () => {
	const keys = await redis.keys('*');

	const log_group = keys.map(async (key) => {

		const result = await redis.lrange(key, 0, -1);

		if (result.length === 0) return;

		const log_text = await get_logs(key, result.length);

		const fileName1 = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');
		const fileName2 = dayjs().tz('Asia/Seoul').format('HH:mm:ss');
		
		const param = {
			Bucket: process.env.S3_PATH || "log-redis-logbucket-phsle8mf872u",
			Key: `${key}/${fileName1}/${fileName2}.txt`,
			'ACL': 'public-read',
			'Body': log_text.join('\n')
		}

		return s3.upload(param).promise();
	})

	return Promise.all(log_group);
}


/**
 * @swagger
 * tags:
 *   name: log
 *   description: 로그
 */

/**
 * @swagger
 * /log/keys/:
 *   get:
 *     security:
 *       - Access_Token: []
 *     summary: 키 조회
 *     tags: [log]
 *     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
 */

router.get('/keys/', async (req, res) => {
	try {
		const result = await redis.keys('*');

		res.send({
			success: true,
			message: '키 조회 성공',
			data: result
		});

	} catch (e) {
		return badRequest(res, '키 조회 실패', e);
	}
});

/**
 * @swagger
 * /log/info/:
 *   get:
 *     security:
 *       - Access_Token: []
 *     summary: 레디스 로그보기
 *     tags: [log]
 *     parameters:
 *       - in: query
 *         name: project
 *         required: false
 *         type: string
 *     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
 */

router.get('/info/', async (req, res) => {
	try {
		const { project } = req.query;

		if (!project) return badRequest(res, 'project 필수입니다');    

		const result = await redis.lrange(project, 0, -1);

		res.send({
			success: true,
			message: '저장완료',
			data: result
		});

	} catch (e) {
		return badRequest(res, '레디스 로그보기 실패', e);
	}
});


/**
 * @swagger
 * /log/sync/:
 *   get:
 *     security:
 *       - Access_Token: []
 *     summary: 로그 동기화
 *     tags: [log]
 *     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
 */

router.get('/sync/', async (req, res) => {
	try {
		await log_sync();

		res.send({
			success: true,
			message: '동기화완료'
		});

	} catch (e) {
		return badRequest(res, '로그 동기화 실패', e);
	}
});


/**
 * @swagger
 * /log/info/:
 *   post:
 *     tags: [log]
 *     security:
 *       - Access_Token: []
 *     summary: 로그저장
 *     requestBody:
 *       description: 프로젝트 정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/definitions/logInsert"
 *     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
 */

router.post('/info/', async (req, res) => {
	try {
		const { project, log } = req.body;

		if (!project) return badRequest(res, '프로젝트는 필수입니다.');
		if (!log) return badRequest(res, '로그는 필수입니다.');

		redis.rpush(project, log);

		res.send({
			success: true,
			message: '저장완료'
		});
	} catch (e) {
		return badRequest(res, '로그 저장 실패', e);
	}
});


/**
 * @swagger
 * /log/beanstalk/:
 *   post:
 *     tags: [log]
 *     security:
 *       - Access_Token: []
 *     summary: 빈스토크 서버 로그저장
 *     requestBody:
 *       description: 프로젝트 정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/definitions/logInsert"
 *     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
 */


router.post('/beanstalk/', async (req, res) => {
	try {
		const { project, log } = req.body;

		if (!project) return badRequest(res, '프로젝트는 필수입니다.');
		if (!log) return badRequest(res, '로그는 필수입니다.');
		
		redis.rpush(`beanstalk/${project}`, log);

		res.send({
			success: true,
			message: '빈스토크 서버 로그 저장완료'
		});
	} catch (e) {
		return badRequest(res, '로그 저장 실패', e);
	}
});


module.exports = router;