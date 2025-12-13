# 🎵 Music Wheel Player - Cloudflare R2 Version

Interactive music player with Cloudflare R2 storage.

## ✨ Changes from Original

### **Storage:**
- ❌ ~~Google Drive~~ removed
- ✅ **Cloudflare R2** (S3-compatible object storage)

### **Benefits:**
- 💰 10GB free storage
- 🚀 Fast global CDN
- 🔒 Secure and reliable
- 📈 Scales infinitely
- 💵 Only $0.015/GB after 10GB

## 🛠️ Tech Stack

- **Backend**: Python, Flask
- **Frontend**: JavaScript, Canvas API, Tone.js
- **Storage**: Cloudflare R2
- **Deployment**: Railway

## 📦 Requirements

### Environment Variables:
```bash
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET_NAME=music-wheel  # optional, default: music-wheel
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # optional
FLASK_ENV=production  # optional
PORT=5000  # auto-set by Railway/Render
```

## 🚀 Quick Start

### Local Development:
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables (create `.env` file):
   ```
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY=your_access_key
   R2_SECRET_KEY=your_secret_key
   ```

3. Run:
   ```bash
   python app.py
   ```

4. Open:
   - Player: http://localhost:5000
   - Upload: http://localhost:5000/upload

### Deployment:
See `DEPLOYMENT_GUIDE.md` for step-by-step instructions.

## 📁 Project Structure

```
SONG_R2_DEPLOY/
├── app.py                 # Flask application
├── r2_manager.py          # R2 storage manager
├── requirements.txt       # Python dependencies
├── Procfile              # Railway/Heroku config
├── .gitignore            # Git ignore file
├── static/               # CSS, JS, images
├── templates/            # HTML templates
└── temp_uploads/         # Temporary upload folder
```

## 🔐 Security

- All files stored in Cloudflare R2
- Public URLs generated for audio/images
- No sensitive data in repository
- Environment variables for credentials

## 💰 Cost Estimate

### With 50GB of music:
```
Railway Server: $5/month
Cloudflare R2:
  - First 10GB: Free
  - Next 40GB: $0.60/month (40 × $0.015)

Total: ~$5.60/month
```

### With 100GB of music:
```
Railway Server: $5/month
Cloudflare R2:
  - First 10GB: Free
  - Next 90GB: $1.35/month (90 × $0.015)

Total: ~$6.35/month
```

## 📞 Support

For issues or questions, check:
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Railway Docs](https://docs.railway.app)
- [Flask Docs](https://flask.palletsprojects.com)

## 📄 License

MIT
