import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    university: "",
    degree: "",
    graduation_year: "",
    target_role: "",
    bio: "",
    location: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    skills: []
  });

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchProfileAndResumes = async () => {
    setLoading(true);
    try {
      const pRes = await api.get("/api/profile/me");
      setProfile(pRes.data);

      const rRes = await api.get("/resumes/my");
      setResumes(rRes.data);
    } catch (err) {
      console.error("Error fetching profile/resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndResumes();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage("");
    try {
      await api.put("/api/profile/me", {
        phone: profile.phone,
        university: profile.university,
        degree: profile.degree,
        graduation_year: profile.graduation_year,
        target_role: profile.target_role,
        bio: profile.bio,
        location: profile.location,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        portfolio_url: profile.portfolio_url,
        skills: profile.skills
      });
      setStatusMessage("Profile updated successfully! ✅");
    } catch (err) {
      setStatusMessage("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please choose a PDF or DOCX resume.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    setStatusMessage("");
    try {
      const res = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      localStorage.setItem("resume_id", String(res.data.id));
      setStatusMessage(`Resume uploaded & parsed successfully: ${res.data.filename} 🎉`);
      setSelectedFile(null);
      e.target.reset();
      fetchProfileAndResumes();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Resume upload failed.";
      setStatusMessage(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      await api.post(`/resumes/${id}/set-active`);
      localStorage.setItem("resume_id", String(id));
      fetchProfileAndResumes();
      setStatusMessage("Primary active resume updated! 🎯");
    } catch (err) {
      alert("Could not set active resume.");
    }
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await api.delete(`/resumes/${id}`);
      fetchProfileAndResumes();
      setStatusMessage("Resume deleted.");
    } catch (err) {
      alert("Could not delete resume.");
    }
  };

  const handleDownload = (id) => {
    const base = api.defaults.baseURL || "";
    window.open(`${base}/resumes/${id}/download`, "_blank");
  };

  return (
    <Layout
      title="1. Student Profile & Resume Management"
      subtitle="Configure your academic background, target role, and manage resume versions"
    >
      {statusMessage && (
        <div className="alert-banner">
          {statusMessage}
        </div>
      )}

      <div className="profile-layout-grid">
        {/* Left Column: Profile Details */}
        <section className="panel-box profile-form-panel">
          <div className="panel-header-simple">
            <h3>👤 Student Academic & Career Profile</h3>
            <span className="badge-light">Module 1</span>
          </div>

          <form onSubmit={handleProfileSubmit} className="styled-form">
            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={profile.name || ""} disabled className="input-disabled" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={profile.email || ""} disabled className="input-disabled" />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Current Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, India"
                  value={profile.location || ""}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>University / College</label>
                <input
                  type="text"
                  placeholder="e.g. VTU / IIT / NIT / University"
                  value={profile.university || ""}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Degree & Major</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={profile.degree || ""}
                  onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Graduation Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  value={profile.graduation_year || ""}
                  onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Target Internship Role</label>
                <input
                  type="text"
                  placeholder="e.g. Backend Developer / AI Engineer"
                  value={profile.target_role || ""}
                  onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Professional Bio / Objective</label>
              <textarea
                rows={3}
                placeholder="Write a brief professional summary of your strengths and career aspirations..."
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={profile.linkedin_url || ""}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={profile.github_url || ""}
                  onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Portfolio / Personal Website</label>
                <input
                  type="url"
                  placeholder="https://myportfolio.dev"
                  value={profile.portfolio_url || ""}
                  onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Profile Details"}
            </button>
          </form>
        </section>

        {/* Right Column: Resume Management */}
        <section className="panel-box resumes-panel">
          <div className="panel-header-simple">
            <h3>📄 Resume Management & Versions</h3>
            <span className="badge-primary">{resumes.length} Uploaded</span>
          </div>

          {/* Upload Box */}
          <form onSubmit={handleResumeUpload} className="upload-box-card">
            <h4>Upload New Resume</h4>
            <p>Upload your latest PDF or DOCX file for automatic parsing and matching.</p>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="file-input-field"
            />
            <button type="submit" className="btn-primary btn-block" disabled={uploading}>
              {uploading ? "Parsing with AI..." : "Upload & Parse Resume"}
            </button>
          </form>

          {/* Resumes List */}
          <div className="resumes-list-section">
            <h4>Your Resume Versions</h4>
            {resumes.length === 0 && (
              <p className="empty-hint">No resumes uploaded yet. Upload a PDF/DOCX to get started!</p>
            )}

            {resumes.map((r) => (
              <div key={r.id} className={`resume-item-card ${r.is_active ? "active-resume" : ""}`}>
                <div className="resume-meta">
                  <div className="resume-title-row">
                    <strong>{r.filename}</strong>
                    {r.is_active && <span className="active-tag">Primary Match</span>}
                  </div>
                  <small>Uploaded: {r.uploaded_at}</small>
                  {r.preview_snippet && <p className="resume-snippet">{r.preview_snippet}</p>}
                </div>

                <div className="resume-actions-row">
                  <Link to={`/resume-parser?id=${r.id}`} className="btn-sm btn-outline">
                    🔍 Deep Extract
                  </Link>
                  {!r.is_active && (
                    <button
                      type="button"
                      onClick={() => handleSetActive(r.id)}
                      className="btn-sm btn-outline"
                    >
                      ⭐ Set Active
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(r.id)}
                    className="btn-sm btn-outline"
                  >
                    ⬇️ Download
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteResume(r.id)}
                    className="btn-sm btn-danger"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
