const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Redis = require('ioredis');
const redis_address = process.env.REDIS_ADDRESS;
const redis = new Redis(redis_address);

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

exports.get = async (event) => {
	try {
		await log_sync();

		let sync_time = moment().format('YYYY-MM-DD HH:mm:ss');
		console.log('배치', sync_time);

		return {
			statusCode: 200,
			body: JSON.stringify(`${sync_time} 배치 성공`),
		};

	} catch (e) {
		console.log('마지막', e.message);
		return {
			statusCode: 200,
			body: JSON.stringify('Error'),
		};
	}
};
