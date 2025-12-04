from flask import Flask, render_template, request, jsonify
from r2_manager import R2Manager
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = 'temp_uploads'

# Ensure temp upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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
        
        if not album_name:
            return jsonify({'status': 'error', 'message': 'Album name required'}), 400
        
        print(f"\n🎵 Initializing album: {album_name}")
        print(f"📊 Tracks: {track_count}")
        print(f"🎨 Styles: {styles}")
        
        album_id = storage_manager.initialize_album_structure(album_name, track_count, styles)
        
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


@app.route('/api/upload/track', methods=['POST'])
def upload_track():
    """Upload track files to R2 storage"""
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
        
        # Process all style files
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
        
        print(f"✅ Track {track_number} upload complete: {len(uploaded_files)} files")
        
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
