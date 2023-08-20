import express, { json } from 'express'
import cors from 'cors'
import multer, { memoryStorage } from 'multer'
import { deleteImageFromURL, getUserPresignedUrls, uploadToS3 } from './s3.mjs'
import 'dotenv/config'

const app = express()
const storage = memoryStorage()
const upload = multer({storage})

app.use(cors({ origin: "*" }))
app.use(json())
app.post('/images', upload.single("image"), (req, res) => {
    const { file } = req
    const userId = req.headers["x-user-id"]
    if (!file || !userId) {
        return res.status(400).json({
            message: "Bad request"
        })
    }
    const { error, key } = uploadToS3({file, userId})
    if (error) {
        return res.status(500).json({ message: error.message })
    }
    return res.status(201).json({ key })
})

app.get('/images', async (req, res) => {
    const userId = req.headers["x-user-id"]
    if (!userId) {
        return res.status(400).json({
            message: "Bad request"
        })
    }
    const presignedUrls = await getUserPresignedUrls(userId)
    if (!presignedUrls) {
        return res.status(400).json({
            message: "Bad request"
        })
    }

    return res.json(presignedUrls)
})

app.delete("/images", async (req, res) => {
    const key = req.body.key
    if (!key) {
        return res.status(400).json({
            message: "Bad request"
        })
    }
    const status = await deleteImageFromURL(key)
    if (!status) {
        return res.status(500).json({ message: error.message })
    }
    return res.status(201).json({ status })
})

app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`))