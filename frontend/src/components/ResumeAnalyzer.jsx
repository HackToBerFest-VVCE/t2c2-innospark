import { useState, useMemo, useRef, useEffect } from 'react'
import { Icon } from './common/Icons'
import { CATALOG_ROLES } from '../constants/roles'
import { downloadResumeReport } from '../services/api'

export function ResumeAnalyzer({
  resume,
  setResume,
  removeResume,
  fileInput,
  loading,
  result,
  error,
  analyze,
  loadSampleResume,
  skills = [],
  _setSkills,
  role = 'Python Developer',
  setRole,
  gap,
  navigate,
  jobMatch,
  isRealResume = false,
}) {
  const [activeTab, setActiveTab] = useState('skills') // 'skills' | 'experience' | 'education' | 'projects' | 'certifications' | 'missing'
  const [dragging, setDragging] = useState(false)
  const [skillSearch, setSkillSearch] = useState('')
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [reportError, setReportError] = useState('')
  const [showFullResumeModal, setShowFullResumeModal] = useState(false)
  const [expandedMatched, setExpandedMatched] = useState(false)

  // Interactive Dropdown states
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('All') // 'All' | 'Matched' | 'Partial' | 'Missing'

  const roleDropdownRef = useRef(null)
  const filterDropdownRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false)
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Candidate info
  const candidateName = result?.name || 'Not analyzed'
  const overallScore = result?.overall_score ?? (gap ? Math.round(gap.skill_coverage_percentage) : 0)
  const experienceText = result?.experience_text || '—'
  const educationDegree = result?.education_degree || '—'
  const educationField = result?.education_field || 'Not detected'
  const analysisTimestamp = result?.analysis_timestamp || ''
  const summaryText =
    result?.summary_text ||
    result?.section_content?.summary ||
    'Upload and analyze a PDF resume to see extracted evidence.'

  // Skills lists (dynamically updated if gap data is available)
  const matchedSkillsList = useMemo(() => {
    if (result?.matched_skills && result.matched_skills.length > 0) {
      return result.matched_skills
    }
    if (gap?.matched_required_skills && gap.matched_required_skills.length > 0) {
      return gap.matched_required_skills
    }
    return []
  }, [gap, result?.matched_skills])

  const extraMatchedCount = result?.matched_more_count ?? 0

  const partiallyMatchedList = useMemo(() => {
    if (result?.partially_matched_skills && result.partially_matched_skills.length > 0) {
      return result.partially_matched_skills
    }
    return []
  }, [result?.partially_matched_skills])

  const missingSkillsList = useMemo(() => {
    if (result?.missing_skills && result.missing_skills.length > 0) {
      return result.missing_skills
    }
    if (gap?.missing_required_skills && gap.missing_required_skills.length > 0) {
      return gap.missing_required_skills
    }
    return []
  }, [gap, result?.missing_skills])

  // Filter skills by search query
  const filteredMatched = useMemo(() => {
    if (!skillSearch) return matchedSkillsList
    return matchedSkillsList.filter((s) => s.toLowerCase().includes(skillSearch.toLowerCase()))
  }, [matchedSkillsList, skillSearch])

  const filteredPartial = useMemo(() => {
    if (!skillSearch) return partiallyMatchedList
    return partiallyMatchedList.filter((s) => s.toLowerCase().includes(skillSearch.toLowerCase()))
  }, [partiallyMatchedList, skillSearch])

  const filteredMissing = useMemo(() => {
    if (!skillSearch) return missingSkillsList
    return missingSkillsList.filter((s) => s.toLowerCase().includes(skillSearch.toLowerCase()))
  }, [missingSkillsList, skillSearch])

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer?.files?.[0]) {
      handleFileSelection(event.dataTransfer.files[0])
    }
  }

  function handleFileSelection(file) {
    setResume(file)
  }

  async function handleDownloadPDFReport() {
    setDownloadingReport(true)
    setReportError('')
    try {
      await downloadResumeReport({
        target_role: role,
        skills,
        readiness_score: overallScore,
        missing_skills: missingSkillsList,
        matched_skills: matchedSkillsList,
        accepted_improvements: [],
        job_match: jobMatch,
      })
    } catch (err) {
      setReportError(err.message || 'Failed to generate PDF report.')
    } finally {
      setDownloadingReport(false)
    }
  }

  // Format file size
  function formatBytes(bytes) {
    if (!bytes) return '2.4 MB'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    const kb = bytes / 1024
    return `${Math.round(kb)} KB`
  }

  const fileName = resume?.name || 'Rohit_Sharma_Resume.pdf'
  const fileSize = formatBytes(resume?.size || 2.4 * 1024 * 1024)

  return (
    <div className="resume-analyzer-view">
      {/* Breadcrumb Navigation */}
      <div className="dashboard-breadcrumb" aria-label="Breadcrumb">
        <span className="crumb-root" onClick={() => navigate && navigate('overview')}>Workspace</span>
        <span className="crumb-separator">/</span>
        <span className="crumb-current">Resume Analyzer</span>
      </div>

      {/* Page Header */}
      <div className="analyzer-header-row">
        <div className="analyzer-title-group">
          <div className="analyzer-title-badge">
            <Icon name="sparkle" size={24} />
          </div>
          <div>
            <h1>Resume Analyzer</h1>
            <p>
              Get AI-powered insights from your resume. Extract skills, identify gaps, and get personalized
              recommendations to advance your career.
            </p>
          </div>
        </div>

        <div className="analyzer-header-actions">
          <button
            type="button"
            className="use-sample-btn"
            onClick={loadSampleResume}
            disabled={loading}
          >
            <Icon name="file" size={16} />
            <span>Use Sample Resume</span>
          </button>
          <span className="sample-hint-text">Try with a sample resume to explore the features.</span>
        </div>
      </div>

      {/* Main Grid: Left Intake Column + Right Analysis Column */}
      <div className="analyzer-grid-layout">
        {/* ================= LEFT COLUMN ================= */}
        <div className="analyzer-left-col">
          {/* Step Progress Bar */}
          <div className="analyzer-steps-bar">
            <div className={`step-item ${!resume ? 'active' : 'completed'}`}>
              <span className="step-num">{resume ? '✓' : '1'}</span>
              <span className="step-label">Upload</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step-item ${resume && !result ? 'active' : result ? 'completed' : ''}`}>
              <span className="step-num">{result ? '✓' : '2'}</span>
              <span className="step-label">Analyze</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step-item ${result ? 'active' : ''}`}>
              <span className="step-num">3</span>
              <span className="step-label">Results</span>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
          />

          {/* If no resume uploaded yet, show full drag-and-drop zone */}
          {!resume ? (
            <div
              className={`modern-dropzone ${dragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInput.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInput.current?.click()}
              aria-label="Drag and drop your resume here or click to browse files"
            >
              <div className="dropzone-cloud-icon">
                <Icon name="cloud-upload" size={40} />
              </div>
              <strong className="dropzone-main-text">Drag & drop your resume here</strong>
              <span className="dropzone-sub-link">or click to browse files</span>
              <span className="dropzone-meta-text">PDF (Max 5 MB)</span>
            </div>
          ) : (
            /* When resume is uploaded: Place prominently at the TOP */
            <div className="uploaded-resume-hero">
              <div className="uploaded-file-card">
                <div className="pdf-icon-badge">
                  <Icon name="pdf" size={20} />
                </div>
                <div className="uploaded-file-details">
                  <strong className="uploaded-file-title" title={fileName}>{fileName}</strong>
                  <span className="uploaded-file-subtitle">{fileSize} • PDF Document</span>
                </div>
                <div className="file-ready-status">
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} aria-hidden="true"></span>
                      <span style={{ color: '#38bdf8' }}>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check-circle" size={15} className="ready-icon" />
                      <span>{result ? 'Analyzed' : 'File ready'}</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="remove-file-x"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (removeResume) {
                      removeResume()
                    }
                  }}
                  aria-label="Remove uploaded resume"
                  title="Remove this file"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>

              {/* Action Buttons directly under the file card */}
              <div className="file-actions-row" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="action-btn replace-file-btn"
                  onClick={() => fileInput.current?.click()}
                >
                  <Icon name="refresh" size={15} />
                  <span>Replace File</span>
                </button>
                <button
                  type="button"
                  className="action-btn analyze-resume-btn"
                  onClick={analyze}
                  disabled={loading}
                >
                  <Icon name="sparkle" size={15} />
                  <span>{loading ? 'Analyzing...' : result ? 'Re-Analyze Resume' : 'Analyze Resume'}</span>
                </button>
              </div>
              <p className={`resume-analysis-status ${loading ? 'is-loading' : ''}`}>
                {loading
                  ? 'Analyzing...'
                  : result
                    ? 'Analysis Complete'
                    : 'File uploaded successfully. Click Analyze Resume to continue.'}
              </p>
            </div>
          )}

          {error && (
            <div className="analyzer-inline-error" style={{ marginTop: '12px' }}>
              <Icon name="close" size={14} /> {error}
            </div>
          )}

          {/* Target Career Role Card with Interactive Accessible Options Dropdown */}
          <div className="role-selector-card" ref={roleDropdownRef}>
            <div className="role-card-header">
              <div className="role-icon-badge">
                <Icon name="target" size={18} />
              </div>
              <div className="role-card-titles">
                <strong>Target Career Role</strong>
                <span>Select your desired role to get tailored insights</span>
              </div>
            </div>

            {/* Custom Interactive Dropdown Button */}
            <div className="custom-dropdown-container">
              <button
                type="button"
                className="custom-role-dropdown-btn"
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isRoleDropdownOpen}
                aria-label="Target Career Role Options Menu"
              >
                <span className="selected-role-name">{role}</span>
                <Icon
                  name="chevron-down"
                  size={16}
                  className={`dropdown-chevron-animated ${isRoleDropdownOpen ? 'open' : ''}`}
                />
              </button>

              {/* Dropdown Options Menu */}
              {isRoleDropdownOpen && (
                <div className="custom-role-options-menu" role="listbox">
                  <div className="options-menu-header">AVAILABLE CAREER ROLES ({CATALOG_ROLES.length})</div>
                  {CATALOG_ROLES.map((r) => {
                    const isSelected = r === role
                    return (
                      <button
                        key={r}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`custom-role-option-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          if (setRole) setRole(r)
                          setIsRoleDropdownOpen(false)
                        }}
                      >
                        <span className="option-name">{r}</span>
                        {isSelected && <Icon name="check" size={14} className="option-check-icon" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Why analyze your resume Card */}
          <div className="why-analyze-card">
            <div className="why-card-header">
              <div className="why-icon-badge">
                <Icon name="lightbulb" size={18} />
              </div>
              <strong>Why analyze your resume?</strong>
            </div>
            <p>
              Our AI extracts your skills, experience and achievements, compares them with job
              requirements, and gives you actionable recommendations to improve your chances of
              getting hired.
            </p>
          </div>

          {/* Bottom 3-feature row */}
          <div className="security-features-bar">
            <div className="sec-feature-item">
              <div className="sec-icon">
                <Icon name="lock" size={18} />
              </div>
              <div className="sec-texts">
                <strong>Secure & Private</strong>
                <span>Your data is processed securely</span>
              </div>
            </div>

            <div className="sec-feature-item">
              <div className="sec-icon">
                <Icon name="file" size={18} />
              </div>
              <div className="sec-texts">
                <strong>Multiple Formats</strong>
                <span>PDF, DOCX, TXT (Max 5 MB)</span>
              </div>
            </div>

            <div className="sec-feature-item">
              <div className="sec-icon">
                <Icon name="sparkle" size={18} />
              </div>
              <div className="sec-texts">
                <strong>AI Powered</strong>
                <span>Advanced parsing & analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="analyzer-right-col">
          {/* Analysis Complete Status Banner */}
          <div className="analysis-status-banner">
            <div className="status-banner-left">
              {loading ? (
                <>
                  <div className="status-check-badge" style={{ background: '#0284c7' }}>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true"></span>
                  </div>
                  <div>
                    <strong className="status-title">Analyzing Resume...</strong>
                    <span className="status-subtitle">Extracting skills, sections, and computing role readiness...</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="status-check-badge">
                    <Icon name="check" size={18} />
                  </div>
                  <div>
                    <strong className="status-title">{isRealResume ? 'Analysis Complete' : 'Demonstration Analysis'}</strong>
                    <span className="status-subtitle">
                      {isRealResume
                        ? 'Your resume has been analyzed successfully!'
                        : 'Using clearly labeled sample data. Upload your resume for personalized results.'}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="status-banner-right">
              <span className="analysis-timestamp">
                {loading ? 'Analyzing document...' : analysisTimestamp ? `Analyzed on ${analysisTimestamp}` : 'Sample profile'}
              </span>
              <button
                type="button"
                className="download-report-btn"
                onClick={handleDownloadPDFReport}
                disabled={downloadingReport || loading}
              >
                <Icon name="download" size={15} />
                <span>{downloadingReport ? 'Downloading...' : 'Download Report'}</span>
              </button>
            </div>
          </div>

          {reportError && (
            <div className="analyzer-inline-error">
              <Icon name="close" size={14} /> {reportError}
            </div>
          )}

          {/* 4 Metric Cards Grid */}
          <div className="metrics-four-grid">
            {/* 1. Overall Match Score */}
            <div className="metric-box score-metric-box">
              <div className="donut-gauge-container">
                <svg viewBox="0 0 80 80" className="donut-gauge-svg">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="donut-bg-ring"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="donut-fill-ring"
                    style={{
                      strokeDasharray: '201.06',
                      strokeDashoffset: `${201.06 * (1 - overallScore / 100)}`,
                    }}
                  />
                </svg>
                <div className="donut-gauge-number">{overallScore}%</div>
              </div>
              <div className="score-details-text">
                <strong className="metric-heading">Overall Match Score</strong>
                <span className="metric-subheading">Good match for your target role</span>
                <button
                  type="button"
                  className="metric-link-btn"
                  onClick={() => navigate && navigate('gap')}
                >
                  <span>View Details</span>
                  <Icon name="arrow" size={13} />
                </button>
              </div>
            </div>

            {/* 2. Extracted Skills */}
            <div className="metric-box">
              <div className="metric-icon-badge cyan-badge">
                <Icon name="nodes" size={18} />
              </div>
              <div className="metric-stat-content">
                <span className="metric-label">Extracted Skills</span>
                <strong className="metric-large-stat">{extractedSkillsCount}</strong>
                <span className="metric-caption">
                  Hard skills: {hardSkillsCount} | Soft skills: {softSkillsCount}
                </span>
              </div>
            </div>

            {/* 3. Experience */}
            <div className="metric-box">
              <div className="metric-icon-badge amber-badge">
                <Icon name="briefcase" size={18} />
              </div>
              <div className="metric-stat-content">
                <span className="metric-label">Experience</span>
                <strong className="metric-large-stat">{experienceText}</strong>
                <span className="metric-caption">{result?.experience_subtitle || 'No evidence available'}</span>
              </div>
            </div>

            {/* 4. Education */}
            <div className="metric-box">
              <div className="metric-icon-badge purple-badge">
                <Icon name="grad-cap" size={18} />
              </div>
              <div className="metric-stat-content">
                <span className="metric-label">Education</span>
                <strong className="metric-large-stat">{educationDegree}</strong>
                <span className="metric-caption">{educationField}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="detail-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'skills'}
              className={`detail-tab-pill ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              Skills
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'experience'}
              className={`detail-tab-pill ${activeTab === 'experience' ? 'active' : ''}`}
              onClick={() => setActiveTab('experience')}
            >
              Experience
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'education'}
              className={`detail-tab-pill ${activeTab === 'education' ? 'active' : ''}`}
              onClick={() => setActiveTab('education')}
            >
              Education
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'projects'}
              className={`detail-tab-pill ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              Projects
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'certifications'}
              className={`detail-tab-pill ${activeTab === 'certifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('certifications')}
            >
              Certifications
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'missing'}
              className={`detail-tab-pill ${activeTab === 'missing' ? 'active' : ''}`}
              onClick={() => setActiveTab('missing')}
            >
              Missing Info
            </button>
          </div>

          {/* TAB CONTENT: Skills (Default) */}
          {activeTab === 'skills' && (
            <div className="skills-analysis-card">
              {/* Header with Search and Filter */}
              <div className="skills-card-header">
                <h3>Skills Analysis</h3>
                <div className="skills-filter-controls">
                  <div className="skills-search-wrapper">
                    <Icon name="search" size={14} className="skills-search-icon" />
                    <input
                      type="text"
                      placeholder="Search skills..."
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      className="skills-search-input"
                    />
                  </div>

                  {/* Filter Dropdown Container */}
                  <div className="filter-dropdown-container" ref={filterDropdownRef}>
                    <button
                      type="button"
                      className="filter-dropdown-btn"
                      onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                      aria-haspopup="true"
                      aria-expanded={isFilterDropdownOpen}
                    >
                      <span>{selectedFilter === 'All' ? 'Filter' : selectedFilter}</span>
                      <Icon
                        name="chevron-down"
                        size={13}
                        className={`dropdown-chevron-animated ${isFilterDropdownOpen ? 'open' : ''}`}
                      />
                    </button>

                    {isFilterDropdownOpen && (
                      <div className="filter-options-menu">
                        <button
                          type="button"
                          className={`filter-option-item ${selectedFilter === 'All' ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedFilter('All')
                            setIsFilterDropdownOpen(false)
                          }}
                        >
                          All Skills ({matchedSkillsList.length + partiallyMatchedList.length + missingSkillsList.length})
                        </button>
                        <button
                          type="button"
                          className={`filter-option-item ${selectedFilter === 'Matched' ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedFilter('Matched')
                            setIsFilterDropdownOpen(false)
                          }}
                        >
                          Matched Only ({matchedSkillsList.length})
                        </button>
                        <button
                          type="button"
                          className={`filter-option-item ${selectedFilter === 'Partial' ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedFilter('Partial')
                            setIsFilterDropdownOpen(false)
                          }}
                        >
                          Partially Matched Only ({partiallyMatchedList.length})
                        </button>
                        <button
                          type="button"
                          className={`filter-option-item ${selectedFilter === 'Missing' ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedFilter('Missing')
                            setIsFilterDropdownOpen(false)
                          }}
                        >
                          Missing Only ({missingSkillsList.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Skill Columns */}
              <div className="skills-three-columns">
                {/* 1. Matched Skills */}
                {(selectedFilter === 'All' || selectedFilter === 'Matched') && (
                  <div className="skill-bucket-box matched-bucket">
                    <div className="bucket-title matched-color">
                      <Icon name="check-circle" size={15} />
                      <span>Matched Skills ({matchedSkillsList.length + (expandedMatched ? 0 : extraMatchedCount)})</span>
                    </div>
                    <div className="skill-pills-list">
                      {filteredMatched.map((skill) => (
                        <span key={skill} className="skill-pill pill-matched">
                          {skill}
                        </span>
                      ))}
                      {extraMatchedCount > 0 && !expandedMatched && !skillSearch && (
                        <button
                          type="button"
                          className="skill-pill pill-more"
                          onClick={() => setExpandedMatched(true)}
                        >
                          +{extraMatchedCount} more
                        </button>
                      )}
                      {expandedMatched && !skillSearch && (
                        <>
                          <span className="skill-pill pill-matched">REST APIs</span>
                          <span className="skill-pill pill-matched">Linux</span>
                          <span className="skill-pill pill-matched">Problem Solving</span>
                          <span className="skill-pill pill-matched">Teamwork</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Partially Matched */}
                {(selectedFilter === 'All' || selectedFilter === 'Partial') && (
                  <div className="skill-bucket-box partial-bucket">
                    <div className="bucket-title partial-color">
                      <Icon name="clock" size={15} />
                      <span>Partially Matched ({partiallyMatchedList.length})</span>
                    </div>
                    <div className="skill-pills-list">
                      {filteredPartial.map((skill) => (
                        <span key={skill} className="skill-pill pill-partial">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Missing Skills */}
                {(selectedFilter === 'All' || selectedFilter === 'Missing') && (
                  <div className="skill-bucket-box missing-bucket">
                    <div className="bucket-title missing-color">
                      <Icon name="alert-triangle" size={15} />
                      <span>Missing Skills ({missingSkillsList.length})</span>
                    </div>
                    <div className="skill-pills-list">
                      {filteredMissing.map((skill) => (
                        <span key={skill} className="skill-pill pill-missing">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Experience */}
          {activeTab === 'experience' && (
            <div className="skills-analysis-card tab-content-panel">
              <div className="skills-card-header">
                <h3>Work & Intern Experience</h3>
              </div>
              <p className="tab-body-text">
                {result?.section_content?.experience || 'No experience section was detected.'}
              </p>
            </div>
          )}

          {/* TAB CONTENT: Education */}
          {activeTab === 'education' && (
            <div className="skills-analysis-card tab-content-panel">
              <div className="skills-card-header">
                <h3>Education Credentials</h3>
              </div>
              <p className="tab-body-text">
                {result?.section_content?.education || 'No education section was detected.'}
              </p>
            </div>
          )}

          {/* TAB CONTENT: Projects */}
          {activeTab === 'projects' && (
            <div className="skills-analysis-card tab-content-panel">
              <div className="skills-card-header">
                <h3>Portfolio Projects</h3>
              </div>
              <p className="tab-body-text">
                {result?.section_content?.projects || 'No projects section was detected.'}
              </p>
            </div>
          )}

          {/* TAB CONTENT: Certifications */}
          {activeTab === 'certifications' && (
            <div className="skills-analysis-card tab-content-panel">
              <div className="skills-card-header">
                <h3>Certifications</h3>
              </div>
              <p className="tab-body-text">
                {result?.section_content?.certifications || 'No certifications section was detected.'}
              </p>
            </div>
          )}

          {/* TAB CONTENT: Missing Info */}
          {activeTab === 'missing' && (
            <div className="skills-analysis-card tab-content-panel">
              <div className="skills-card-header">
                <h3>Missing Resume Information</h3>
              </div>
              <p className="tab-body-text">
                Consider adding measurable business impact metrics (e.g., % latency reduction, user growth) and official cloud/backend certifications to increase hiring conversion.
              </p>
            </div>
          )}

          {/* Resume Summary Card */}
          <div className="resume-summary-card">
            <div className="summary-card-header">
              <div className="summary-title-left">
                <div className="summary-icon-badge">
                  <Icon name="file" size={16} />
                </div>
                <strong>Resume Summary</strong>
              </div>
              <button
                type="button"
                className="view-full-resume-btn"
                onClick={() => setShowFullResumeModal(true)}
              >
                <span>View Full Resume</span>
                <Icon name="arrow" size={14} />
              </button>
            </div>
            <p className="summary-card-body">{summaryText}</p>
          </div>

          {/* Quick Actions Bar */}
          <div className="quick-actions-section">
            <div className="quick-actions-header">
              <Icon name="compass" size={16} className="qa-compass-icon" />
              <span>Quick Actions</span>
            </div>
            <div className="quick-actions-row">
              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate && navigate('portfolio')}
              >
                <Icon name="wand" size={15} />
                <span>Improve Resume</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate && navigate('matcher')}
              >
                <Icon name="file" size={15} />
                <span>Compare with Job</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate && navigate('gap')}
              >
                <Icon name="target" size={15} />
                <span>Go to Skill Gap</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => navigate && navigate('roadmap')}
              >
                <Icon name="book" size={15} />
                <span>View Learning Plan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Full Resume */}
      {showFullResumeModal && (
        <div className="full-resume-modal-overlay" onClick={() => setShowFullResumeModal(false)}>
          <div className="full-resume-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-left">
                <Icon name="file" size={18} />
                <h3>Resume Details · {candidateName}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowFullResumeModal(false)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="modal-content-scroll">
              <div className="modal-section">
                <h4>Professional Summary</h4>
                <p>{summaryText}</p>
              </div>
              <div className="modal-section">
                <h4>Experience</h4>
                <p>{result?.section_content?.experience || 'No experience section was detected.'}</p>
              </div>
              <div className="modal-section">
                <h4>Education</h4>
                <p>{result?.section_content?.education || 'No education section was detected.'}</p>
              </div>
              <div className="modal-section">
                <h4>Skills</h4>
                <p>{skills.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
