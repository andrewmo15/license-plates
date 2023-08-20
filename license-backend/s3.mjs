import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuid } from 'uuid'
import 'dotenv/config'

const BUCKET = process.env.S3_BUCKET
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
const region = process.env.S3_REGION
const s3 = new S3Client({ credentials: {accessKeyId, secretAccessKey}, region })

export const uploadToS3 = async ({ file, userId }) => {
    const key = `${userId}/${uuid()}`
    const command = new PutObjectCommand({ 
        Bucket: BUCKET, 
        Key: key, 
        Body: file.buffer,
        ContentType: file.mimetype
    })
    try {
        await s3.send(command)
        return { key }
    } catch (error) {
        console.log(error)
        return { error }
    }
}

const getImageKeysByUser = async (userId) => {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET, 
        Prefix: userId
    })
    const { Contents=[] } = await s3.send(command)
    return Contents.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified)).map(image => image.Key)
}

export const getUserPresignedUrls = async (userId) => {
    try {
        const imageKeys = await getImageKeysByUser(userId)
        const presignedURLs = await Promise.all(imageKeys.map((key) => {
            const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
            return getSignedUrl(s3, command, { expiresIn: 900 })
        }))
        const keyToURL = []
        for (let i = 0; i < imageKeys.length; i++) {
            keyToURL.push([imageKeys[i], presignedURLs[i]])
        }
        return keyToURL
    } catch (error) {
        console.log(error)
        return null
    }
}

export const deleteImageFromURL = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        })
        const response = await s3.send(command)
        return "Success"
    } catch (error) {
        console.log(error)
        return null
    }
}