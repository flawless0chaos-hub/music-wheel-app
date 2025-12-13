from flask import Flask, render_template, request, jsonify
from r2_manager import R2Manager
import os
import re
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = 'temp_uploads'

# Ensure temp upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Helper function to extract YouTube ID
def extract_youtube_id(url):
    """Extract YouTube video ID from URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

# Initialize R2 Storage Manager
try:
    storage_manager = R2Manager()
    print("✅ R2 Storage Manager initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize R2 Manager: {e}")
    print("⚠️  Make sure to set R2 environment variables:")
    print("   - R2_ACCOUNT_ID")
    print("   - R2_ACCESS_KEY")
    print("   - R2_SECRET_KEY")
    print("   - R2_BUCKET_NAME (optional, defaults to 'music-wheel')")
    print("   - R2_PUBLIC_URL (optional)")
    storage_manager = None


# ===============================
# Player Routes
# ===============================

@app.route('/')
def index():
    """Main player page"""
    return render_template('index.html')


@app.route('/upload')
def upload_page():
    """Upload manager page"""
    return render_template('upload.html')


# ===============================
# API Endpoints
# ===============================

@app.route('/api/albums/list', methods=['GET'])
def list_albums():
    """Get list of all albums from R2 storage"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        albums = storage_manager.list_albums()
        return jsonify({'status': 'success', 'albums': albums})
    except Exception as e:
        print(f"Error listing albums: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/album/load', methods=['GET'])
def load_album():
    """Load album data from R2 storage"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        album_name = request.args.get('album')
        if not album_name:
            return jsonify({'status': 'error', 'message': 'Album name required'}), 400
        
        print(f"\n📖 Loading album: {album_name}")
        album_data = storage_manager.load_album_data(album_name)
        
        if album_data:
            print(f"✅ Album loaded: {len(album_data.get('tracks', {}))} tracks")
            return jsonify({'status': 'success', 'data': album_data})
        else:
            return jsonify({'status': 'error', 'message': 'Album not found'}), 404
            
    except Exception as e:
        print(f"Error loading album: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/album/init', methods=['POST'])
def init_album():
    """Initialize new album structure in R2 storage"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        data = request.json
        album_name = data.get('album')
        track_count = data.get('trackCount', 8)
        styles = data.get('styles', ['Rock', 'Funk', 'Hip Hop', 'Blues', 'Theatrical'])
        use_transitions = data.get('useTransitions', False)
        
        if not album_name:
            return jsonify({'status': 'error', 'message': 'Album name required'}), 400
        
        print(f"\n🎵 Initializing album: {album_name}")
        print(f"📊 Tracks: {track_count}")
        print(f"🎨 Styles: {styles}")
        print(f"🔄 Transitions: {'Yes' if use_transitions else 'No'}")
        
        album_id = storage_manager.initialize_album_structure(album_name, track_count, styles, use_transitions)
        
        return jsonify({
            'status': 'success',
            'message': f'Album "{album_name}" created successfully',
            'album_id': album_id
        })
        
    except Exception as e:
        print(f"Error initializing album: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/album/delete', methods=['POST'])
def delete_album():
    """Delete an album from R2 storage"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        data = request.json
        album_name = data.get('album')
        
        if not album_name:
            return jsonify({'status': 'error', 'message': 'Album name required'}), 400
        
        print(f"\n🗑️ Deleting album: {album_name}")
        
        storage_manager.delete_album(album_name)
        
        return jsonify({
            'status': 'success',
            'message': f'Album "{album_name}" deleted successfully'
        })
        
    except Exception as e:
        print(f"Error initializing album: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/upload/track', methods=['POST'])
def upload_track():
    """Upload track files or YouTube links to R2 storage"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        # Get form data
        album_name = request.form.get('album')
        track_number = int(request.form.get('number'))
        track_name = request.form.get('name', f'Track {track_number}')
        artist_name = request.form.get('artist', 'Unknown Artist')
        
        print(f"\n📤 Uploading Track {track_number}: {track_name} by {artist_name}")
        
        # Update track metadata
        storage_manager.update_track_metadata(album_name, track_number, track_name, artist_name)
        
        uploaded_files = []
        
        # Upload icon if present
        if 'icon' in request.files:
            icon_file = request.files['icon']
            if icon_file.filename:
                filename = secure_filename(icon_file.filename)
                temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                icon_file.save(temp_path)
                
                try:
                    url = storage_manager.upload_track_file(
                        album_name, track_number, 'icon', None, temp_path
                    )
                    uploaded_files.append(f"icon: {url}")
                finally:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
        
        # Process YouTube links first
        for key in request.form:
            if key in ['album', 'number', 'name', 'artist']:
                continue
            
            if key.startswith('youtube_'):
                youtube_url = request.form[key]
                if not youtube_url:
                    continue
                
                video_id = extract_youtube_id(youtube_url)
                if not video_id:
                    print(f"  ⚠️  Invalid YouTube URL: {youtube_url}")
                    continue
                
                # Parse key: "youtube_track_rock", "youtube_transition_rock"
                parts = key.split('_')[1:]  # Remove 'youtube_' prefix
                
                if parts[0] == 'track':
                    style_key = '_'.join(parts[1:])
                    file_type = 'audio'
                elif parts[0] == 'transition':
                    style_key = '_'.join(parts[1:])
                    file_type = 'transition_audio'
                else:
                    continue
                
                # Store YouTube video ID
                url = storage_manager.store_youtube_link(
                    album_name, track_number, file_type, style_key, video_id
                )
                uploaded_files.append(f"{key}: {url}")
                print(f"  ✅ YouTube link stored: {key}")
        
        # Process all uploaded files
        for key in request.files:
            if key == 'icon':
                continue
                
            file = request.files[key]
            if not file.filename:
                continue
            
            # Parse key: "track_rock", "lyrics_rock", "transition_rock", "transition_lyrics_rock"
            parts = key.split('_')
            
            if parts[0] == 'track':
                # track_rock.mp3
                style_key = '_'.join(parts[1:])
                file_type = 'audio'
            elif parts[0] == 'lyrics':
                # lyrics_rock.txt
                style_key = '_'.join(parts[1:])
                file_type = 'lyrics'
            elif parts[0] == 'transition':
                if parts[1] == 'lyrics':
                    # transition_lyrics_rock.txt
                    style_key = '_'.join(parts[2:])
                    file_type = 'transition_lyrics'
                else:
                    # transition_rock.mp3
                    style_key = '_'.join(parts[1:])
                    file_type = 'transition_audio'
            else:
                continue
            
            # Save file temporarily
            filename = secure_filename(file.filename)
            temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(temp_path)
            
            try:
                url = storage_manager.upload_track_file(
                    album_name, track_number, file_type, style_key, temp_path
                )
                uploaded_files.append(f"{key}: {url}")
                print(f"  ✅ Uploaded: {key}")
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        print(f"✅ Track {track_number} upload complete: {len(uploaded_files)} items")
        
        return jsonify({
            'status': 'success',
            'message': f'Track {track_number} uploaded successfully',
            'files': uploaded_files
        })
        
    except Exception as e:
        print(f"Error uploading track: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ===============================
# Social Features API
# ===============================

@app.route('/api/social/like', methods=['POST'])
def add_like():
    """Toggle like for a track"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        data = request.json
        album_name = data.get('album')
        track_number = data.get('track')
        user_id = data.get('userId', 'anonymous')
        
        result = storage_manager.toggle_like(album_name, track_number, user_id)
        return jsonify({'status': 'success', 'liked': result['liked'], 'count': result['count']})
    except Exception as e:
        print(f"Error toggling like: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/social/comment', methods=['POST'])
def add_comment():
    """Add a comment to a track"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        data = request.json
        album_name = data.get('album')
        track_number = data.get('track')
        user_name = data.get('userName', 'Anonymous')
        comment_text = data.get('comment')
        
        if not comment_text:
            return jsonify({'status': 'error', 'message': 'Comment text required'}), 400
        
        result = storage_manager.add_comment(album_name, track_number, user_name, comment_text)
        return jsonify({'status': 'success', 'comment': result})
    except Exception as e:
        print(f"Error adding comment: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/social/comments', methods=['GET'])
def get_comments():
    """Get all comments for a track"""
    try:
        if not storage_manager:
            return jsonify({'status': 'error', 'message': 'Storage not initialized'}), 500
        
        album_name = request.args.get('album')
        track_number = int(request.args.get('track'))
        
        comments = storage_manager.get_comments(album_name, track_number)
        return jsonify({'status': 'success', 'comments': comments})
    except Exception as e:
        print(f"Error getting comments: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ===============================
# Error Handlers
# ===============================

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'status': 'error', 'message': 'File too large (max 100MB)'}), 413


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'status': 'error', 'message': 'Internal server error'}), 500


# ===============================
# Run Server
# ===============================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    print("\n" + "=" * 50)
    print("🎵 Music Wheel Manager Starting...")
    print("=" * 50)
    print(f"\n📍 Port: {port}")
    print(f"🔧 Debug Mode: {debug_mode}")
    print(f"☁️  Storage: Cloudflare R2")
    print("\n" + "=" * 50 + "\n")
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)

# ===============================
# Audio Proxy for CORS
# ===============================

@app.route('/api/proxy/audio')
def proxy_audio():
    """Proxy audio files from R2 to avoid CORS issues"""
    try:
        url = request.args.get('url')
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
        
        import requests
        response = requests.get(url, stream=True)
        
        def generate():
            for chunk in response.iter_content(chunk_size=8192):
                yield chunk
        
        return app.response_class(
            generate(),
            mimetype='audio/mpeg',
            headers={
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes'
            }
        )
    except Exception as e:
        print(f"Error proxying audio: {e}")
        return jsonify({'error': str(e)}), 500

