import React, { useState } from 'react';
import api from '../api';

function PhotoUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [error, setError] = useState('');

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                setSelectedFile(null);
            } else {
                setSelectedFile(file);
                setError('');
                setUploadedUrl('');
            }
        } else {
            setError('Please select an image file');
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError('');
        setUploadedUrl('');

        try {
            const formData = new FormData();
            formData.append('photo', selectedFile);

            console.log('Starting upload...');
            const response = await api.post('/upload/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log('Upload progress:', percentCompleted + '%');
                }
            });

            console.log('Upload response:', response.data);

            if (response.data.success) {
                setUploadedUrl(response.data.url);
                setSelectedFile(null);
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            const errorMessage = err.response?.data?.error || 
                               err.response?.data?.message || 
                               err.message || 
                               'Error uploading file';
            
            setError(`Upload failed: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Photo to NextCloud</h2>
                
                <div className="mb-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Max file size: 5MB</p>
                </div>

                {selectedFile && (
                    <div className="mb-4 text-sm text-gray-600">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium
                        ${!selectedFile || uploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {uploading ? 'Uploading...' : 'Upload to NextCloud'}
                </button>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {uploadedUrl && (
                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <h3 className="text-lg font-medium mb-2 text-green-700">Uploaded Successfully!</h3>
                        <div className="break-all text-sm text-blue-600">
                            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                View in NextCloud Photos Folder →
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PhotoUpload;
