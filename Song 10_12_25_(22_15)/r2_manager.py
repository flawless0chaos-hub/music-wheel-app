import boto3
from botocore.client import Config
import os
import json
import io

class R2Manager:
    """
    Cloudflare R2 Storage Manager
    Replaces Google Drive for file storage
    """
    
    def __init__(self):
        """Initialize R2 client with credentials from environment"""
        
        # Get credentials from environment variables
        account_id = os.environ.get('R2_ACCOUNT_ID')
        access_key = os.environ.get('R2_ACCESS_KEY')
        secret_key = os.environ.get('R2_SECRET_KEY')
        bucket_name = os.environ.get('R2_BUCKET_NAME', 'music-wheel')
        
        if not all([account_id, access_key, secret_key]):
            raise Exception("Missing R2 credentials! Set R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY")
        
        # Initialize S3-compatible client for R2
        self.s3 = boto3.client(
            's3',
            endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        
        self.bucket_name = bucket_name
        self.public_url = os.environ.get('R2_PUBLIC_URL', f'https://pub-{account_id}.r2.dev')
        
        print(f"✅ R2 Manager initialized. Bucket: {self.bucket_name}")
    
    def _get_file_path(self, album_name, track_number, file_type, style_key=None):
        """Generate consistent file paths in R2"""
        track_folder = f"albums/{album_name}/Track_{track_number:02d}"
        
        if file_type == 'icon':
            return f"{track_folder}/icon.png"
        elif file_type == 'audio':
            return f"{track_folder}/{style_key}_track.mp3"
        elif file_type == 'lyrics':
            return f"{track_folder}/{style_key}_lyrics.txt"
        elif file_type == 'social_data':
            return f"{track_folder}/social_data.json"
        elif file_type == 'transition_audio':
            return f"{track_folder}/{style_key}_transition.mp3"
        elif file_type == 'transition_lyrics':
            return f"{track_folder}/{style_key}_transition_lyrics.txt"
        elif file_type == 'track_info':
            return f"{track_folder}/track_info.json"
        elif file_type == 'album_metadata':
            return f"albums/{album_name}/album_metadata.json"
        else:
            raise Exception(f"Unknown file type: {file_type}")
    
    def initialize_album_structure(self, album_name, track_count, styles, use_transitions=False):
        """Create album structure in R2 with dynamic categories and transitions toggle"""
        try:
            print("\n" + "=" * 50)
            print(f"🎵 Initializing Album: {album_name}")
            print(f"📊 Tracks: {track_count}")
            print(f"🎨 Styles: {len(styles)}")
            print(f"🔄 Transitions: {'Enabled' if use_transitions else 'Disabled'}")
            print("=" * 50 + "\n")
            
            # Create album metadata
            album_metadata = {
                "album_name": album_name,
                "track_count": track_count,
                "use_transitions": use_transitions,
                "styles": []
            }
            
            # Extended color palette for more categories
            default_colors = [
                '#d13b3b', '#9b3480', '#513c99', '#2373a1', '#1da9a0',
                '#25a56a', '#c6a527', '#d96c27', '#c73a63', '#7c4199',
                '#3498db', '#e74c3c', '#9b59b6', '#1abc9c', '#f39c12'
            ]
            
            for idx, style_name in enumerate(styles):
                album_metadata["styles"].append({
                    "name": style_name,
                    "key": style_name.lower().replace(' ', '_'),
                    "color": default_colors[idx % len(default_colors)]
                })
            
            # Save album metadata
            metadata_path = self._get_file_path(album_name, 0, 'album_metadata')
            self._upload_json(album_metadata, metadata_path)
            print(f"✅ Saved album_metadata.json")
            
            # Create track info for each track
            for i in range(1, track_count + 1):
                track_info = {
                    "track_number": i,
                    "track_name": f"Track {i}",
                    "artist_name": "Unknown Artist",
                    "icon_url": "",
                    "styles": {}
                }
                
                for style in styles:
                    style_key = style.lower().replace(' ', '_')
                    style_data = {
                        "audio_url": "",
                        "audio_type": "file",  # 'file' or 'youtube'
                        "youtube_id": "",
                        "lyrics_url": "",
                        "uploaded": False
                    }
                    
                    # Add transition fields if enabled
                    if use_transitions:
                        style_data.update({
                            "transition_audio_url": "",
                            "transition_audio_type": "file",
                            "transition_youtube_id": "",
                            "transition_lyrics_url": ""
                        })
                    
                    track_info["styles"][style_key] = style_data
                
                # Initialize social data
                social_data = {
                    "likes": [],
                    "like_count": 0,
                    "comments": []
                }
                
                track_path = self._get_file_path(album_name, i, 'track_info')
                social_path = self._get_file_path(album_name, i, 'social_data')
                
                self._upload_json(track_info, track_path)
                self._upload_json(social_data, social_path)
                print(f"📁 Created Track_{i:02d}")
            
            print(f"\n✅ Album '{album_name}' initialized successfully!\n")
            return album_name
            
        except Exception as e:
            raise Exception(f"Error creating album: {e}")
    
    def _upload_json(self, data, file_path):
        """Upload JSON data to R2"""
        json_content = json.dumps(data, indent=2, ensure_ascii=False)
        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=file_path,
            Body=json_content.encode('utf-8'),
            ContentType='application/json'
        )
    
    def _download_json(self, file_path):
        """Download and parse JSON from R2"""
        try:
            response = self.s3.get_object(Bucket=self.bucket_name, Key=file_path)
            content = response['Body'].read().decode('utf-8')
            return json.loads(content)
        except Exception as e:
            print(f"Error downloading {file_path}: {e}")
            return None
    
    def update_track_metadata(self, album_name, track_number, track_name, artist_name):
        """Update track metadata"""
        try:
            track_path = self._get_file_path(album_name, track_number, 'track_info')
            track_info = self._download_json(track_path)
            
            if not track_info:
                raise Exception("track_info.json not found")
            
            track_info['track_name'] = track_name
            track_info['artist_name'] = artist_name
            
            self._upload_json(track_info, track_path)
            print(f"  ✅ Metadata updated for Track {track_number}")
            
        except Exception as e:
            raise Exception(f"Error updating metadata: {e}")
    
    def upload_track_file(self, album_name, track_number, file_type, style_key, file_path):
        """Upload a file to R2"""
        try:
            # Generate R2 path
            r2_path = self._get_file_path(album_name, track_number, file_type, style_key)
            
            # Determine content type
            if file_type == 'icon':
                content_type = 'image/png'
            elif file_type in ['audio', 'transition_audio']:
                content_type = 'audio/mpeg'
            elif file_type in ['lyrics', 'transition_lyrics']:
                content_type = 'text/plain'
            else:
                content_type = 'application/octet-stream'
            
            # Upload file
            with open(file_path, 'rb') as f:
                self.s3.put_object(
                    Bucket=self.bucket_name,
                    Key=r2_path,
                    Body=f,
                    ContentType=content_type
                )
            
            # Generate public URL
            file_url = f"{self.public_url}/{r2_path}"
            
            # Update track_info.json
            track_info_path = self._get_file_path(album_name, track_number, 'track_info')
            track_info = self._download_json(track_info_path)
            
            if track_info:
                # Update the correct field
                if file_type == 'icon':
                    track_info['icon_url'] = file_url
                elif file_type == 'audio':
                    if style_key not in track_info['styles']:
                        track_info['styles'][style_key] = {}
                    track_info['styles'][style_key]['audio_url'] = file_url
                    track_info['styles'][style_key]['audio_type'] = 'file'
                    track_info['styles'][style_key]['uploaded'] = True
                elif file_type == 'lyrics':
                    if style_key not in track_info['styles']:
                        track_info['styles'][style_key] = {}
                    track_info['styles'][style_key]['lyrics_url'] = file_url
                elif file_type == 'transition_audio':
                    if style_key not in track_info['styles']:
                        track_info['styles'][style_key] = {}
                    track_info['styles'][style_key]['transition_audio_url'] = file_url
                    track_info['styles'][style_key]['transition_audio_type'] = 'file'
                elif file_type == 'transition_lyrics':
                    if style_key not in track_info['styles']:
                        track_info['styles'][style_key] = {}
                    track_info['styles'][style_key]['transition_lyrics_url'] = file_url
                
                self._upload_json(track_info, track_info_path)
            
            print(f"  ✅ Uploaded: {r2_path}")
            return file_url
            
        except Exception as e:
            raise Exception(f"Error uploading file: {e}")
    
    def load_album_data(self, album_name):
        """Load complete album data"""
        try:
            # Load album metadata
            metadata_path = self._get_file_path(album_name, 0, 'album_metadata')
            album_metadata = self._download_json(metadata_path)
            
            if not album_metadata:
                return None
            
            album_styles = album_metadata.get('styles', [])
            track_count = album_metadata.get('track_count', 8)
            use_transitions = album_metadata.get('use_transitions', False)
            
            print(f"✅ Loaded album: {album_name}")
            print(f"📊 Styles: {len(album_styles)}")
            print(f"🔄 Transitions: {'Yes' if use_transitions else 'No'}")
            
            album_data = {
                'albumName': album_name,
                'artist': 'Various Artists',
                'styles': album_styles,
                'useTransitions': use_transitions,
                'tracks': {},
                'transitions': {}
            }
            
            # Load all tracks
            for i in range(1, track_count + 1):
                track_path = self._get_file_path(album_name, i, 'track_info')
                track_info = self._download_json(track_path)
                
                # Load social data
                social_path = self._get_file_path(album_name, i, 'social_data')
                social_data = self._download_json(social_path)
                
                if track_info:
                    track_num = track_info['track_number']
                    
                    track_data = {
                        'number': track_num,
                        'name': track_info.get('track_name', f'Track {track_num}'),
                        'artist': track_info.get('artist_name', 'Unknown Artist'),
                        'icon': track_info.get('icon_url'),
                        'styles': {},
                        'social': {
                            'likes': social_data.get('like_count', 0) if social_data else 0,
                            'comments': len(social_data.get('comments', [])) if social_data else 0
                        }
                    }
                    
                    for style_key, style_data in track_info.get('styles', {}).items():
                        if style_data.get('audio_url'):
                            track_data['styles'][style_key] = {
                                'url': style_data['audio_url'],
                                'type': style_data.get('audio_type', 'file'),
                                'youtube_id': style_data.get('youtube_id', ''),
                                'lyrics_url': style_data.get('lyrics_url'),
                                'uploaded': True
                            }
                            
                            if use_transitions:
                                track_data['styles'][style_key]['transition_url'] = style_data.get('transition_audio_url', '')
                                track_data['styles'][style_key]['transition_type'] = style_data.get('transition_audio_type', 'file')
                                track_data['styles'][style_key]['transition_lyrics_url'] = style_data.get('transition_lyrics_url', '')
                    
                    album_data['tracks'][str(track_num)] = track_data
                    print(f"  ✅ Track {i}")
            
            return album_data
            
        except Exception as e:
            print(f"Error loading album: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def list_albums(self):
        """List all albums in R2"""
        try:
            # List all album folders
            response = self.s3.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='albums/',
                Delimiter='/'
            )
            
            albums = []
            for prefix in response.get('CommonPrefixes', []):
                album_name = prefix['Prefix'].replace('albums/', '').replace('/', '')
                if album_name:
                    albums.append(album_name)
            
            return albums
            
        except Exception as e:
            print(f"Error listing albums: {e}")
            return []
    
    def store_youtube_link(self, album_name, track_number, file_type, style_key, video_id):
        """Store YouTube video ID as audio source"""
        try:
            track_info_path = self._get_file_path(album_name, track_number, 'track_info')
            track_info = self._download_json(track_info_path)
            
            if not track_info:
                raise Exception("track_info.json not found")
            
            youtube_url = f"https://www.youtube.com/watch?v={video_id}"
            
            if style_key not in track_info['styles']:
                track_info['styles'][style_key] = {}
            
            if file_type == 'audio':
                track_info['styles'][style_key]['audio_url'] = youtube_url
                track_info['styles'][style_key]['audio_type'] = 'youtube'
                track_info['styles'][style_key]['youtube_id'] = video_id
                track_info['styles'][style_key]['uploaded'] = True
            elif file_type == 'transition_audio':
                track_info['styles'][style_key]['transition_audio_url'] = youtube_url
                track_info['styles'][style_key]['transition_audio_type'] = 'youtube'
                track_info['styles'][style_key]['transition_youtube_id'] = video_id
            
            self._upload_json(track_info, track_info_path)
            print(f"  ✅ YouTube link stored: {video_id}")
            
            return youtube_url
            
        except Exception as e:
            raise Exception(f"Error storing YouTube link: {e}")
    
    def toggle_like(self, album_name, track_number, user_id):
        """Toggle like for a track"""
        try:
            social_path = self._get_file_path(album_name, track_number, 'social_data')
            social_data = self._download_json(social_path)
            
            if not social_data:
                social_data = {"likes": [], "like_count": 0, "comments": []}
            
            if user_id in social_data['likes']:
                social_data['likes'].remove(user_id)
                liked = False
            else:
                social_data['likes'].append(user_id)
                liked = True
            
            social_data['like_count'] = len(social_data['likes'])
            
            self._upload_json(social_data, social_path)
            
            return {'liked': liked, 'count': social_data['like_count']}
            
        except Exception as e:
            raise Exception(f"Error toggling like: {e}")
    
    def add_comment(self, album_name, track_number, user_name, comment_text):
        """Add a comment to a track"""
        try:
            from datetime import datetime
            
            social_path = self._get_file_path(album_name, track_number, 'social_data')
            social_data = self._download_json(social_path)
            
            if not social_data:
                social_data = {"likes": [], "like_count": 0, "comments": []}
            
            comment = {
                "id": len(social_data['comments']) + 1,
                "user": user_name,
                "text": comment_text,
                "timestamp": datetime.now().isoformat()
            }
            
            social_data['comments'].append(comment)
            
            self._upload_json(social_data, social_path)
            
            return comment
            
        except Exception as e:
            raise Exception(f"Error adding comment: {e}")
    
    def get_comments(self, album_name, track_number):
        """Get all comments for a track"""
        try:
            social_path = self._get_file_path(album_name, track_number, 'social_data')
            social_data = self._download_json(social_path)
            
            if not social_data:
                return []
            
            return social_data.get('comments', [])
            
        except Exception as e:
            print(f"Error getting comments: {e}")
            return []
