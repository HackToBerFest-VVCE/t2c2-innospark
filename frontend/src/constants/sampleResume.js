export const SAMPLE_RESUME_FILE = {
  name: 'Rohit_Sharma_Resume.pdf',
  size: 2.4 * 1024 * 1024,
  type: 'application/pdf',
}

export const SAMPLE_RESUME_RESULT = {
  name: 'Rohit Sharma',
  headline: 'Aspiring Developer',
  target_role: 'Python Developer',
  overall_score: 78,
  match_assessment: 'Good match for your target role',
  extracted_skills_count: 12,
  hard_skills_count: 9,
  soft_skills_count: 3,
  experience_text: '2+ years',
  experience_subtitle: 'Relevant experience found',
  education_degree: 'B.Tech',
  education_field: 'Computer Science',
  analysis_timestamp: '26 Oct 2026, 05:32 PM',

  skills: [
    'Python',
    'JavaScript',
    'HTML',
    'CSS',
    'Git',
    'REST APIs',
    'Linux',
    'Problem Solving',
    'Team Collaboration',
  ],

  matched_skills: [
    'Python',
    'JavaScript',
    'HTML',
    'CSS',
    'Git',
  ],
  matched_more_count: 4,

  partially_matched_skills: [
    'React (basic)',
    'SQL (basic)',
    'Docker (basic)',
  ],

  missing_skills: [
    'FastAPI',
    'PostgreSQL',
    'System Design',
    'AWS',
  ],

  summary_text:
    'Rohit is a Computer Science graduate with 2+ years of experience in web development. Proficient in Python, JavaScript, and modern web technologies. Experienced in building responsive web applications and working with databases.',

  categorized_skills: {
    Languages: ['Python', 'JavaScript', 'HTML', 'CSS', 'SQL'],
    'Frameworks & Libraries': ['React', 'FastAPI', 'Django'],
    'Databases & Analytics': ['SQL', 'PostgreSQL'],
    'DevOps & Tools': ['Git', 'GitHub', 'Docker', 'AWS'],
  },
  sections: {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    certifications: false,
  },
  section_content: {
    summary:
      'Rohit is a Computer Science graduate with 2+ years of experience in web development. Proficient in Python, JavaScript, and modern web technologies. Experienced in building responsive web applications and working with databases.',
    experience:
      'Software Developer (2+ years) · Developed responsive web applications and integrated backend services using Python and JavaScript.',
    education:
      'B.Tech in Computer Science · Relevant Coursework: Data Structures, Algorithms, Database Management, Web Development.',
    projects:
      'SkillBridge AI Career Platform · Full-stack project utilizing modern web technologies and AI integrations.',
    certifications:
      'No formal certifications detected in resume. Consider obtaining AWS or Python certifications.',
  },
  evidence_items: [
    { skill: 'Python', page: 1, evidence: 'Built web applications and backend automation scripts using Python.' },
    { skill: 'JavaScript', page: 1, evidence: 'Implemented dynamic UI features with JavaScript and modern tooling.' },
    { skill: 'HTML & CSS', page: 1, evidence: 'Designed responsive layouts conforming to modern web standards.' },
    { skill: 'Git', page: 1, evidence: 'Collaborated on code repositories with Git version control.' },
  ],
  quality: {
    score: 78,
    feedback: 'Good match for your target role. Advancing FastAPI, PostgreSQL, and System Design will close key gaps.',
  },
  verification_status: 'verified',
}
