import { useState } from 'react';
import axios from 'axios';

export default function AddBookForm() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('author', formData.author);
    data.append('description', formData.description);
    data.append('pdf', pdfFile);
    if (coverFile) data.append('cover', coverFile);

    try {
      const response = await axios.post('/api/books', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      alert('Book added successfully!');
      // Reset form
      setFormData({ title: '', author: '', description: '' });
      setPdfFile(null);
      setCoverFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <h2>Add New Book</h2>
      
      <div className="form-group">
        <label>Title*</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label>Author*</label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({...formData, author: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>PDF File*</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
          required
        />
      </div>

      <div className="form-group">
        <label>Cover Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files[0])}
        />
      </div>

      {isUploading && (
        <div className="progress-bar">
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}

      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Add Book'}
      </button>
    </form>
  );
}