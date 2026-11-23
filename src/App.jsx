import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createPortalTransition } from './components/portalTransition'
import { listenForPagePresses } from './components/pagePressFeedback'
import { readTransitionSound, writeTransitionSound } from './components/transitionSoundPreference'
import { FocusMode, StudyLeaderboards } from './components/StudyFeatures'
import Icon from './components/Icon'
import Ollie from './components/Ollie'
import OllieLoading from './components/OllieLoading'
import OllieCompletion from './components/OllieCompletion'
import inkWordmark from './assets/wordmark-ink.png'
import { materials as seededMaterials, priorities, topics } from './data'

const navigation = [
  ['dashboard', 'Dashboard', 'dashboard'],
  ['course', 'My Course', 'courses'],
  ['study', 'Study', 'study'],
  ['tutor', 'Tutor', 'tutor'],
  ['progress', 'Progress', 'progress'],
  ['focus', 'Focus Mode', 'clock'],
  ['leaderboards', 'Leaderboards', 'progress'],
  ['settings', 'Settings', 'settings'],
]

const viewTitles = {
  dashboard: 'Dashboard', course: 'Database Systems', study: 'Study Session',
  tutor: 'Ask Ollie', progress: 'Progress', settings: 'Learning Preferences',
  focus: 'Focus Mode', leaderboards: 'Study Leaderboards',
}

const studyStages = ['Understand', 'Example', 'Check', 'Practice', 'Complete']

function readRoute() {
  const view = new URLSearchParams(window.location.search).get('view') || 'intro'
  return {
    view: view === 'device-focus' ? 'focus' : view,
    hash: window.location.hash,
  }
}

function stageFromHash(hash) {
  const match = hash.match(/^#stage-(\d)$/)
  return match ? Math.min(Number(match[1]), studyStages.length - 1) : null
}

const initialFiles = seededMaterials.map((file) => ({
  ...file,
  status: 'Ready',
  detail: file.type === 'Lecture' ? 'Lecture material' : file.type,
}))

const defaultPreferences = {
  explanation: 'Balanced',
  teaching: 'Step-by-step',
  density: 'Low',
  checks: 'Frequent',
  resources: ['Text', 'Worked examples', 'Practice questions'],
}

const tutorResponses = {
  two_nf: {
    title: 'Second Normal Form, step by step',
    body: 'A relation is in 2NF when it is already in 1NF and every non-key attribute depends on the entire candidate key. If the key is composite, check each non-key attribute for a dependency on only one part.',
    points: ['Confirm the relation is in 1NF.', 'Identify the complete candidate key.', 'Move partial dependencies into separate relations.'],
    sources: [['Lecture 04 - Normalization.pdf', 'Slide 17'], ['Tutorial 04 - Normalization.docx', 'Question 3']],
  },
  two_vs_three: {
    title: '2NF and 3NF solve different dependencies',
    body: 'Second Normal Form removes partial dependencies on part of a composite key. Third Normal Form goes further by removing transitive dependencies between non-key attributes.',
    points: ['2NF: every non-key attribute depends on the whole key.', '3NF: non-key attributes should not depend on other non-key attributes.', 'A table must satisfy 2NF before it can satisfy 3NF.'],
    sources: [['Lecture 04 - Normalization.pdf', 'Slides 17–21'], ['Tutorial 04 - Normalization.docx', 'Questions 3–4']],
  },
  partial_example: {
    title: 'Another partial-dependency example',
    body: 'In RESULT(StudentID, ModuleID, StudentEmail, Mark), the key is (StudentID, ModuleID). StudentEmail depends only on StudentID, so it is a partial dependency.',
    points: ['Move StudentID and StudentEmail into STUDENT.', 'Keep StudentID, ModuleID and Mark in RESULT.', 'Mark stays because it depends on the complete key.'],
    sources: [['Tutorial 04 - Normalization.docx', 'Question 3'], ['Lecture 04 - Normalization.pdf', 'Slide 18']],
  },
  normalization_quiz: {
    title: 'Quick normalization check',
    body: 'Consider ENROLMENT(StudentID, CourseID, StudentName). The key is (StudentID, CourseID). Which dependency prevents this relation from being in 2NF?',
    points: ['A. StudentID → StudentName', 'B. CourseID → StudentID', 'C. (StudentID, CourseID) → StudentName'],
    sources: [['Tutorial 04 - Normalization.docx', 'Question 3'], ['Lecture 04 - Normalization.pdf', 'Slide 17']],
  },
  functional: {
    title: 'Functional Dependencies',
    body: 'A functional dependency states that one attribute, or set of attributes, determines another. If StudentID uniquely identifies StudentName, we write StudentID → StudentName.',
    points: ['The left side is the determinant.', 'The right side is the dependent attribute.', 'Dependencies help identify keys and normalization problems.'],
    sources: [['Lecture 04 - Normalization.pdf', 'Slides 8–12'], ['Tutorial 04 - Normalization.docx', 'Question 1']],
  },
  plsql: {
    title: 'PL/SQL practice starter',
    body: 'PL/SQL adds procedural structures to SQL. A useful first practice is to read a value, apply a condition, and display a result inside a simple block.',
    points: ['DECLARE variables used by the block.', 'BEGIN the executable statements.', 'Finish with EXCEPTION handling and END.'],
    sources: [['Lab 05 - SQL.pdf', 'Page 2']],
  },
}

function tutorResponseFor(question) {
  const normalized = question.toLowerCase().replace(/[’']/g, "'").trim()
  if (normalized === 'explain 2nf step by step' || normalized.includes('second normal form step')) return tutorResponses.two_nf
  if (normalized.includes('difference between 2nf and 3nf')) return tutorResponses.two_vs_three
  if (normalized.includes('another example of partial dependency')) return tutorResponses.partial_example
  if (normalized === 'quiz me on normalization') return tutorResponses.normalization_quiz
  if (normalized.includes('functional dependenc')) return tutorResponses.functional
  if (normalized.includes('pl/sql') || normalized.includes('stored procedure')) return tutorResponses.plsql
  return null
}

function Brand({ onClick }) {
  const wordmark = <img className="brand-wordmark" src={inkWordmark} alt="MyTutorly" />
  return onClick
    ? <button className="brand" onClick={onClick} aria-label="MyTutorly dashboard">{wordmark}</button>
    : wordmark
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

function Paywall({ onClose, onContinue, returnFocus }) {
  return <Modal title="Preview study access" returnFocus={returnFocus} onClose={onClose} actions={<>
    <Button variant="secondary" onClick={onClose}>Back to dashboard</Button>
    <Button onClick={onContinue}>Continue in demo <Icon name="arrow" size={18} /></Button>
  </>}>
    <div className="demo-access">
      <Ollie expression="hi" size={58} />
      <div><strong>One-time access · $100 example</strong><p>This is a sample checkout screen. Continuing opens the study activity for free.</p></div>
    </div>
  </Modal>
}

function ProgressBar({ value, label }) {
  return <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value} aria-label={label}><span style={{ '--progress': value / 100 }} /></div>
}

function SourceButton({ file, location, onOpen }) {
  return <button className="source-reference" onClick={(event) => onOpen({ file, location }, event.currentTarget)}>
    <Icon name="source" size={17} />
    <span><strong>{file}</strong><small>{location}</small></span>
  </button>
}

function Intro({ go, openSample }) {
  return <div className="intro-page">
    <header className="intro-header">
      <Brand />
      <Button variant="secondary" onClick={(event) => go('dashboard', '', event)}>Open workspace <Icon name="arrow" size={17} /></Button>
    </header>
    <main>
      <div className="intro-main">
      <section className="intro-copy">
        <p className="intro-promise">Learning without borders.</p>
        <h1>Your course.<br />Learned <span className="intro-heading-phrase">your way.</span></h1>
        <p className="intro-description">Upload your lecture slides, notes and tutorials. MyTutorly turns what you study into personalised practice that works for you.</p>
        <div className="landing-actions"><Button onClick={(event) => go('dashboard', '', event)} className="intro-action">Start learning <Icon name="arrow" size={20} /></Button><a className="button button-secondary" href="#how-it-works">See how it works</a></div>
        <p className="intro-demo-note">Interactive university prototype · Database Systems sample course</p>
      </section>
      <section className="intro-preview" aria-labelledby="preview-title">
        <div className="preview-course">
          <span className="preview-icon"><Icon name="file" size={22} /></span>
          <div><span className="preview-label">From the Database Systems sample course</span><strong>Lecture 04 · Normalization</strong></div>
        </div>
        <div className="preview-connector" aria-hidden="true"><span>↓</span></div>
        <div className="preview-lesson">
          <Ollie expression="whoa" className="intro-ollie" size={88} followPointer />
          <p className="preview-label"><Icon name="study" size={17} /> Database Systems</p>
          <h2 id="preview-title">Second Normal Form</h2>
          <p>Learn why a detail in a table should depend on the whole key.</p>
          <div className="preview-reference"><Icon name="source" size={16} /> Lecture 04 · Slide 17</div>
          <ul className="preview-formats" aria-label="Lesson activities">
            <li><Icon name="study" size={16} /> Step by step</li>
            <li><Icon name="courses" size={16} /> Worked example</li>
            <li><Icon name="check" size={16} /> Knowledge check</li>
          </ul>
          <Button variant="secondary" onClick={openSample}>Try the sample lesson <Icon name="arrow" size={18} /></Button>
        </div>
      </section>
      </div>

      <section className="landing-workflow" id="how-it-works" aria-labelledby="workflow-title">
        <div className="landing-container">
          <h2 id="workflow-title">From course files to practice</h2>
          <ol className="landing-steps" role="list">
            <li><Icon name="upload" size={26} /><h3>Start with your course</h3><p>Add lecture slides, tutorials and lab notes to the course workspace.</p><Button variant="secondary" onClick={(event) => go('course', '', event)}>Explore course materials</Button></li>
            <li><Icon name="source" size={26} /><h3>Find the concepts that matter</h3><p>See why the sample course recommends revising Second Normal Form.</p><Button variant="secondary" onClick={(event) => go('dashboard', '', event)}>See study priorities</Button></li>
            <li><Icon name="tutor" size={26} /><h3>Ask Ollie to explain</h3><p>See a step-by-step answer and open the lecture reference behind it.</p><Button variant="secondary" onClick={(event) => go('tutor', '#answer', event)}>Open the sample answer</Button></li>
            <li><Icon name="study" size={26} /><h3>Practise and see progress</h3><p>Work through a lesson, try a knowledge check, and see progress after finishing.</p><Button variant="secondary" onClick={openSample}>Try a lesson</Button></li>
          </ol>
        </div>
      </section>
      <section className="landing-container landing-inclusive" aria-labelledby="inclusive-title">
        <div className="landing-ollie"><Ollie expression="hi" size={144} /><span>Meet Ollie</span></div>
        <div><h2 id="inclusive-title">Choose how you learn.</h2><p>MyTutorly is designed for university students who benefit from a clear next step and control over how much information they see. Choose shorter explanations or more detail, revisit examples, and take breaks as you need them.</p><Button variant="secondary" onClick={(event) => go('settings', '', event)}>Explore learning preferences</Button></div>
      </section>
      <section className="landing-start">
        <div className="landing-container"><h2>Ready to study?</h2><Button onClick={(event) => go('dashboard', '', event)}>Start learning <Icon name="arrow" size={20} /></Button></div>
      </section>
    </main>
    <footer className="landing-container landing-footer"><Brand /><span>University prototype · Database Systems sample course</span><a href="#how-it-works">How it works</a></footer>
  </div>
}

function AppShell({ view, go, children, mobileOpen, setMobileOpen, progress }) {
  const sidebarRef = useRef(null)
  const menuRef = useRef(null)
  const restoreMenuFocus = useRef(false)

  function dismissMenu() {
    restoreMenuFocus.current = true
    setMobileOpen(false)
  }

  function navigate(nextView, event) {
    if (nextView === view && mobileOpen) dismissMenu()
    else go(nextView, '', event)
  }

  useEffect(() => {
    if (!mobileOpen && restoreMenuFocus.current) {
      restoreMenuFocus.current = false
      menuRef.current?.focus()
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const sidebar = sidebarRef.current
    const desktop = window.matchMedia('(min-width: 901px)')
    function closeOnDesktop(event) {
      if (event.matches) setMobileOpen(false)
    }
    const focusable = () => Array.from(sidebar?.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])') || []).filter((item) => !item.disabled)
    sidebar?.querySelector('.sidebar-close')?.focus()
    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        restoreMenuFocus.current = true
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeydown)
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [mobileOpen, setMobileOpen])

  return <div className="app-shell">
    {mobileOpen && <div className="sidebar-scrim" aria-hidden="true" onClick={dismissMenu} />}
    <aside ref={sidebarRef} id="primary-navigation" className={`sidebar ${mobileOpen ? 'open' : ''}`} role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen ? true : undefined} aria-label={mobileOpen ? 'Workspace navigation' : undefined}>
      <div className="sidebar-head"><Brand onClick={(event) => navigate('dashboard', event)} /><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={dismissMenu}><Icon name="close" /></button></div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(([id, label, icon]) => <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={(event) => navigate(id, event)}><Icon name={icon} size={19} /><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-course">
        <div><span className="course-monogram small">DB</span><span><strong>Database Systems</strong><small>CSCI235 · Course ready</small></span></div>
        <ProgressBar value={progress} label="Database Systems progress" />
      </div>
      <button className="student-card" onClick={(event) => navigate('settings', event)}><span className="avatar">HA</span><span><strong>Hadi Ahmed</strong><small>Learning preferences</small></span></button>
    </aside>
    <div className="app-column" inert={mobileOpen ? true : undefined}>
      <a className="skip-workspace" href="#workspace-content" onClick={(event) => {
        const content = document.getElementById('workspace-content')
        if (!content) return
        event.preventDefault()
        content.focus()
      }}>Skip to main content</a>
      <header className="topbar">
        <div className="topbar-left"><button ref={menuRef} className="icon-button mobile-menu" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Icon name="menu" /></button><div><small>MyTutorly workspace</small><strong>{viewTitles[view]}</strong></div></div>
      </header>
      <main key={view} id="workspace-content" tabIndex={-1} className={`app-content ${view === 'study' ? 'study-content' : ''}`}>{children}</main>
    </div>
  </div>
}

function PageHeading({ title, description, actions, greeting = false }) {
  return <div className="page-heading"><div className="page-heading-copy">{greeting && <Ollie expression="hi" size={72} />}<div><h1>{title}</h1>{description && <p>{description}</p>}</div></div>{actions && <div className="page-actions">{actions}</div>}</div>
}

function Dashboard({ go, sessionComplete, progress, paywall, files, studyStage }) {
  const recommendations = priorities.slice(0, 4).map((item, index) => ({ ...item, level: index < 2 ? 'High Priority' : 'Medium Priority' }))
  const nextTopic = sessionComplete ? {
    eyebrow: 'Recommended Next',
    category: 'Course foundations',
    title: 'Functional Dependencies',
    description: 'Strengthen determinants and dependency notation before moving to Third Normal Form.',
    action: 'Start Functional Dependencies',
  } : {
    eyebrow: 'Continue Studying',
    category: 'Normalization',
    title: 'Second Normal Form',
    description: 'Learn how to identify and remove partial dependencies from a relation.',
    action: 'Continue Study Session',
  }
  return <div className="page-stack dashboard-page">
    <PageHeading greeting title="Good afternoon, Hadi" description="Pick up your Database Systems study session or add more course material." actions={<>
      <Button variant="primary" onClick={(event) => go('focus', '', event)}>Open Focus Mode</Button>
      <Button variant="secondary" onClick={(event) => go('course', '#upload', event)}><Icon name="upload" size={18} /> Add course material</Button>
    </>} />
    <div className="dashboard-layout">
      <section className="continue-study">
        <div className="continue-top"><span className="section-label">{nextTopic.eyebrow}</span><span className="priority-chip high">High Priority</span></div>
        <div className="continue-topic">
          <div><small>{nextTopic.category}</small><h2>{nextTopic.title}</h2><p>{nextTopic.description}</p></div>
          <div className="continue-portrait"><Ollie expression={sessionComplete ? 'great-job' : 'hi'} size={104} /></div>
        </div>
        <div className="course-progress"><div><span>{sessionComplete ? 'Course progress' : 'Topic progress'}</span><strong>{progress}%</strong></div><ProgressBar value={progress} label={sessionComplete ? 'Database Systems progress' : 'Second Normal Form progress'} /></div>
        {sessionComplete && <div className="progress-update"><Icon name="check" size={17} />Last session completed · Functional Dependencies is ready next.</div>}
        <Button onClick={() => paywall((event) => sessionComplete ? go('tutor', '#functional', event) : go('study', '', event))} className="continue-button">{nextTopic.action}</Button>
        <div className="continue-sources"><Icon name="source" size={16} /><span>{sessionComplete ? 'Grounded in Lecture 04 and Tutorial 04' : 'Built from Lecture 04 and Tutorial 04'}</span></div>
      </section>

      <section className="recommendations">
        <div className="section-heading-row"><div><h2>Revision priorities</h2><p>Based on the topics your course covers most</p></div><span className="panel-icon"><Icon name="study" size={22} /></span></div>
        <details className="priority-help"><summary>How revision priorities work</summary><p>Tutorly estimates priorities from how often a topic appears across your lectures, tutorials, labs and practice materials.</p></details>
        <div className="recommendation-list">{recommendations.map((item) => <button key={item.topic} onClick={(event) => go(item.topic === 'Second Normal Form' ? 'study' : 'progress', '', event)}><span><strong>{item.topic}</strong><small>{item.evidence}</small></span><span className={`priority-chip ${item.level.startsWith('High') ? 'high' : 'medium'}`}>{item.level}</span><Icon name="chevron" size={18} className="recommendation-chevron" /></button>)}</div>
        <p className="priority-disclaimer"><Icon name="info" size={15} />Priority is guidance, not an assessment prediction.</p>
      </section>
    </div>

    <div className="dashboard-overview">
      <section className="workspace-summary">
        <div className="workspace-summary-heading"><span className="course-monogram">DB</span><div><h2>Your course</h2><p>Database Systems · CSCI235</p></div></div>
        <p>{files.length} course files · {topics.length} topics in the study library</p>
        <Button variant="secondary" onClick={(event) => go('course', '', event)}>Open course <Icon name="arrow" size={16} /></Button>
      </section>
      <section className="workspace-summary activity-summary">
        <div className="workspace-summary-heading"><span className="preview-icon"><Icon name="progress" size={20} /></span><div><h2>Study activity</h2><p>{sessionComplete ? '2NF session complete' : `2NF · ${studyStages[studyStage]}`}</p></div></div>
        <p>{sessionComplete ? 'You finished a knowledge check and a practice exercise.' : `Stage ${studyStage + 1} of ${studyStages.length} in your current study session.`}</p>
        <Button variant="secondary" onClick={(event) => go('progress', '', event)}>View progress <Icon name="arrow" size={16} /></Button>
      </section>
    </div>
    <section className="recent-materials">
      <div className="section-heading-row"><div><h2>Recent course material</h2><p>{files.filter((file) => file.status === 'Ready').length} of {files.length} files ready for study.</p></div><button className="text-button" onClick={(event) => go('course', '', event)}>Manage materials</button></div>
      <div className="recent-row">
        {files.slice(0, 3).map((file) => <article key={file.id || file.name}><span className="file-icon"><Icon name="file" size={18} /></span><span><strong>{file.name}</strong><small>{file.type} · {file.status}</small></span></article>)}
      </div>
    </section>
  </div>
}

function CoursePage({ files, onAddFiles, go }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [addedFiles, setAddedFiles] = useState(false)
  const pendingCount = files.filter((file) => file.status !== 'Ready').length

  function addFiles(fileList) {
    if (!fileList.length) {
      setUploadError('Drop files from your device or choose files below.')
      return
    }
    setUploadError('')
    setAddedFiles(true)
    onAddFiles(fileList)
  }

  const readyCount = files.filter((file) => file.status === 'Ready').length
  return <div className="page-stack course-page">
    <PageHeading title="Database Systems" description="CSCI235 · Your uploaded course material, organized into one study workspace." />
    <input ref={inputRef} hidden type="file" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />

    <section className="course-ready-banner"><span className="ready-icon"><Icon name="courses" size={24} /></span><div><h2>Course library</h2><p>Database Systems sample course</p></div><dl className="ready-facts"><div><dt>Study topics</dt><dd>{topics.length}</dd></div><div><dt>Ready files</dt><dd>{readyCount}</dd></div></dl></section>

    <div className="materials-layout">
      <section id="upload" aria-labelledby="upload-heading" className={`upload-card ${dragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}>
        <span className="upload-icon"><Icon name="upload" size={29} /></span><h2 id="upload-heading">{dragging ? 'Drop your files here' : 'Add course material'}</h2><p>Drop files here or choose them from your device. Try a lecture PDF, slide deck, or tutorial document.</p><Button aria-describedby={uploadError ? 'upload-help upload-error' : 'upload-help'} onClick={() => inputRef.current?.click()}>Choose files</Button><small id="upload-help">This demo lists selected files locally. It does not read their content.</small>
        <div role="alert">{uploadError && <p className="upload-error" id="upload-error">{uploadError}</p>}</div>
        {files.length > initialFiles.length && <div className="upload-progress" role="status">
          {pendingCount > 0 ? <OllieLoading compact>Preparing {pendingCount} {pendingCount === 1 ? 'file' : 'files'}…</OllieLoading> : <><span className="upload-completion-icon"><Ollie expression="great-job" size={30} />{addedFiles && <OllieCompletion compact />}</span> All files are ready in this workspace.</>}
        </div>}
      </section>
      <section className="materials-panel">
        <div className="section-heading-row"><div><h2>Course files</h2><p>{files.length} materials in this workspace</p></div><div className="status-legend"><span><i className="uploaded" />Uploaded</span><span><i className="processing" />Processing</span><span><i className="ready" />Ready</span></div></div>
        <div className="material-list">{files.map((file, index) => <article key={file.id || `${file.name}-${index}`}><span className="file-icon"><Icon name="file" size={18} /></span><span className="material-name"><strong>{file.name}</strong><small>{file.type} · {file.size}</small></span><span className={`file-status ${file.status.toLowerCase()}`}>{file.status}{file.status === 'Ready' && <Icon name="check" size={14} />}</span></article>)}</div>
      </section>
    </div>

    <section className="workspace-summary course-activities"><div><h2>Turn Lecture 04 into practice</h2><p>Explore the 2NF sample lesson or ask Ollie for an explanation with course references.</p></div><div><Button onClick={(event) => go('study', '', event)}>Open study session</Button><Button variant="secondary" onClick={(event) => go('tutor', '', event)}>Ask Ollie</Button></div></section>
  </div>
}

function StudyStepper({ stage }) {
  return <ol className="study-stepper" role="list" aria-label="Study stages">
    {studyStages.map((item, index) => <li key={item} aria-current={index === stage ? 'step' : undefined} className={`${index === stage ? 'active' : ''} ${index < stage ? 'complete' : ''}`}>
      <span aria-hidden="true">{index < stage ? <Icon name="check" size={13} /> : index + 1}</span>
      <strong aria-hidden="true">{item}</strong>
      <span className="visually-hidden">{item}{index < stage ? ', completed' : ''}</span>
      {index < studyStages.length - 1 && <i aria-hidden="true" />}
    </li>)}
  </ol>
}

function SourceStrip({ onOpen, onReport, compact = false }) {
  return <div className={`study-source-strip ${compact ? 'compact' : ''}`}><div><span className="source-strip-title"><Icon name="source" size={17} />Sources</span><div className="source-buttons"><SourceButton file="Lecture 04 - Normalization.pdf" location="Slide 17" onOpen={onOpen} /><SourceButton file="Tutorial 04 - Normalization.docx" location="Question 3" onOpen={onOpen} /></div></div><div className="source-strip-actions"><span><Icon name="check" size={14} />Grounded in 2 course sources</span><button onClick={onReport}>Report incorrect answer</button></div></div>
}

function UnderstandStage({ preferences, mode, setMode, next, onSource, onReport }) {
  const simple = mode === 'simple'
  const detailed = mode === 'detail'
  const steps = simple
    ? ['Start with a table that is already in 1NF.', 'Look for a composite key.', 'Move anything that depends on only part of that key.']
    : ['A table must already be in First Normal Form.', 'Check whether the table has a composite key.', 'Check whether a non-key attribute depends on only part of that key.', 'Move the partial dependency into a separate table.']
  return <article className="study-card understand-card">
    <header className="study-card-header"><span className="study-icon"><Icon name="courses" size={22} /></span><div><small>Understand the idea</small><h2>Second Normal Form</h2></div><span className="preference-summary">{simple ? 'Short' : detailed ? 'Detailed' : 'Balanced'} · {preferences.density} density</span></header>
    {simple && <div className="simple-summary"><strong>In simple terms</strong><p>2NF makes sure every detail belongs to the whole key, not just one part of it.</p></div>}
    <div className="lesson-steps">{steps.map((step, index) => <section key={step}><span>{index + 1}</span><p>{step}</p></section>)}</div>
    {detailed && <div className="detail-note"><strong>Why this matters</strong><p>Partial dependencies repeat facts such as student names or course names across many enrollment rows. Separating them reduces duplication and update errors.</p></div>}
    {preferences.density === 'Standard' && !detailed && <div className="detail-note quiet"><strong>Key check</strong><p>Partial dependencies only become possible when a candidate key contains more than one attribute.</p></div>}
    <fieldset className="study-choice-actions">
      <legend>Explanation length</legend>
      <Button type="button" variant={simple ? 'selected' : 'secondary'} aria-pressed={simple} onClick={() => setMode('simple')}>Short</Button>
      <Button type="button" variant={mode === 'balanced' ? 'selected' : 'secondary'} aria-pressed={mode === 'balanced'} onClick={() => setMode('balanced')}>Balanced</Button>
      <Button type="button" variant={detailed ? 'selected' : 'secondary'} aria-pressed={detailed} onClick={() => setMode('detail')}>Detailed</Button>
    </fieldset>
    <div className="stage-nav"><Button onClick={next}>Give me an example <Icon name="arrow" size={18} /></Button></div>
    <SourceStrip onOpen={onSource} onReport={onReport} />
  </article>
}

function ExampleStage({ next, previous, onSource, onReport }) {
  return <article className="study-card example-stage">
    <header className="study-card-header"><span className="study-icon blue"><Icon name="study" size={22} /></span><div><small>Worked example</small><h2>Follow each dependency</h2></div></header>
    <div className="relation-block"><strong>ENROLLMENT</strong><code>StudentID · StudentName · CourseID · CourseName</code><span>Primary key: (StudentID, CourseID)</span></div>
    <div className="dependency-grid"><section><span>StudentID determines</span><strong>StudentName</strong><p>StudentName needs only StudentID, not the complete key.</p></section><section><span>CourseID determines</span><strong>CourseName</strong><p>CourseName needs only CourseID, not the complete key.</p></section></div>
    <div className="therefore"><Icon name="info" size={19} /><p>These are <strong>partial dependencies</strong>, so the relation is not yet in 2NF.</p></div>
    <div className="table-split"><span>Separate into</span><div><article><strong>STUDENT</strong><code>StudentID · StudentName</code></article><article><strong>COURSE</strong><code>CourseID · CourseName</code></article><article><strong>ENROLLMENT</strong><code>StudentID · CourseID</code></article></div></div>
    <div className="stage-nav"><Button variant="secondary" onClick={previous}>Back</Button><Button onClick={next}>Check my understanding</Button></div>
    <SourceStrip onOpen={onSource} onReport={onReport} compact />
  </article>
}

function CheckStage({ next, previous, goUnderstand }) {
  const [answer, setAnswer] = useState('')
  const firstAnswerRef = useRef(null)

  function retry() {
    setAnswer('')
    firstAnswerRef.current?.focus()
  }

  const correct = answer === 'partial'
  const options = [
    ['whole', 'StudentName depends on the whole composite key.'],
    ['partial', 'StudentName depends on StudentID, only part of the key.'],
    ['foreign', 'StudentName should be used as a foreign key.'],
  ]
  return <article className="study-card check-stage">
    <header className="study-card-header"><span className="study-icon amber"><Icon name="quiz" size={22} /></span><div><small>Quick knowledge check</small><h2 id="knowledge-check-title">Why is StudentID → StudentName a problem when the key is (StudentID, CourseID)?</h2></div></header>
    <div className="check-options" role="group" aria-labelledby="knowledge-check-title">{options.map(([id, text], index) => <button key={id} ref={index === 0 ? firstAnswerRef : undefined} onClick={() => { if (!answer) setAnswer(id) }} aria-disabled={Boolean(answer)} tabIndex={answer ? -1 : undefined} className={`${answer === id ? 'selected' : ''} ${answer && id === 'partial' ? 'correct' : ''} ${answer === id && id !== 'partial' ? 'incorrect' : ''}`}><span>{String.fromCharCode(65 + index)}</span>{text}{answer && id === 'partial' && <><Icon name="check" size={18} /><span className="visually-hidden">Correct answer</span></>}{answer === id && id !== 'partial' && <><Icon name="close" size={18} /><span className="visually-hidden">Your choice, incorrect</span></>}</button>)}</div>
    {answer && <div className={`answer-feedback ${correct ? 'correct' : 'incorrect'}`}><div className="feedback-announcement" role="status"><strong className="ollie-feedback"><Ollie expression={correct ? 'great-job' : 'tip'} size={34} />{correct ? 'Correct. Great job!' : 'Nice try! Want it step by step?'}</strong><p>{correct ? 'StudentName depends on only one part of the composite key, so it is a partial dependency.' : 'StudentID already tells you the student’s name. CourseID is only needed to identify which course they took.'}</p></div>{!correct && <div className="feedback-actions"><Button onClick={retry}>Try again</Button><Button variant="secondary" onClick={goUnderstand}>Review the explanation</Button><Button variant="quiet" onClick={previous}>Revisit the example</Button></div>}</div>}
    <div className="stage-nav"><Button variant="secondary" onClick={previous}>Back</Button>{(!answer || correct) && <Button onClick={next} disabled={!correct}>Continue to practice</Button>}</div>
  </article>
}

function PracticeStage({ next, previous }) {
  const [difficulty, setDifficulty] = useState('Medium')
  const [reveal, setReveal] = useState('')
  const [variant, setVariant] = useState(0)
  const prompt = variant === 0
    ? 'Identify the partial dependencies and convert the relation into Second Normal Form.'
    : 'Explain whether the relation is in 2NF, then show any tables needed to remove partial dependencies.'
  return <article className="study-card practice-stage">
    <header className="study-card-header"><span className="study-icon"><Icon name="progress" size={22} /></span><div><small>Generated Practice Question</small><h2>Apply Second Normal Form</h2></div></header>
    <fieldset className="difficulty-control"><legend>Difficulty</legend><div>{['Easy', 'Medium', 'Exam Style'].map((item) => <button type="button" key={item} className={difficulty === item ? 'active' : ''} aria-pressed={difficulty === item} onClick={() => setDifficulty(item)}>{item}</button>)}</div></fieldset>
    <div className="practice-relation"><span>Given</span><code>ENROLLMENT(StudentID, StudentName, CourseID, CourseName)</code><small>Primary key: (StudentID, CourseID)</small></div>
    <p className="practice-prompt">{prompt}</p>
    <div className="practice-actions"><Button variant="quiet" onClick={() => setReveal(reveal === 'hint' ? '' : 'hint')}>{reveal === 'hint' ? 'Hide Hint' : 'Show Hint'}</Button><Button variant="secondary" onClick={() => setReveal(reveal === 'answer' ? '' : 'answer')}>{reveal === 'answer' ? 'Hide Answer' : 'Show Answer'}</Button><Button variant="secondary" onClick={() => { setVariant((value) => (value + 1) % 2); setReveal('') }}>Try Another</Button></div>
    {reveal && <div className={`practice-reveal ${reveal}`}><strong className="ollie-feedback">{reveal === 'hint' && <Ollie expression="tip" size={34} />}{reveal === 'hint' ? 'Hint' : 'Suggested answer'}</strong><p>{reveal === 'hint' ? 'Ask whether StudentName needs CourseID, and whether CourseName needs StudentID.' : 'StudentID → StudentName and CourseID → CourseName are partial dependencies. Create STUDENT(StudentID, StudentName), COURSE(CourseID, CourseName), and ENROLLMENT(StudentID, CourseID).'}</p></div>}
    <div className="based-on"><Icon name="source" size={17} /><span><strong>Based on</strong>Lecture 04 + Tutorial 04</span><small>Generated practice · not a predicted assessment question</small></div>
    <div className="stage-nav"><Button variant="secondary" onClick={previous}>Back</Button><Button onClick={next}>Complete session</Button></div>
  </article>
}

function CompleteStage({ go, restart }) {
  return <article className="study-card complete-stage">
    <Ollie expression="great-job" size={76} /><h2>Session Complete</h2><p>You reviewed Second Normal Form using your Database Systems course material.</p>
    <div className="completion-list"><span><Icon name="check" size={16} />1 explanation</span><span><Icon name="check" size={16} />1 worked example</span><span><Icon name="check" size={16} />1 knowledge check</span><span><Icon name="check" size={16} />1 practice question</span></div>
    <div className="confidence"><span>Topic confidence</span><strong>Good</strong><div><i /><i /><i className="muted" /><i className="muted" /></div></div>
    <section className="next-focus"><small>Recommended Next</small><h3>Functional Dependencies</h3><p>Strengthen determinants and dependency notation before moving to Third Normal Form.</p></section>
    <p className="ollie-break"><Ollie expression="rest" size={38} /> Take a short break whenever you’re ready.</p>
    <div className="complete-actions"><Button onClick={(event) => go('progress', '', event)}>See your progress</Button><Button variant="quiet" onClick={(event) => { restart(); go('tutor', '#functional', event) }}>Continue Learning</Button><Button variant="secondary" onClick={(event) => go('dashboard', '', event)}>Back to Dashboard</Button></div>
  </article>
}

function StudyPage({ go, stage, setStage, preferences, onSource, onReport, markComplete }) {
  const [mode, setMode] = useState({ Short: 'simple', Detailed: 'detail' }[preferences.explanation] || 'balanced')
  function next() { const nextStage = Math.min(stage + 1, 4); setStage(nextStage); if (nextStage === 4) markComplete() }
  function previous() { setStage(Math.max(stage - 1, 0)) }
  return <div className="study-page">
    <div className="study-heading"><div><button className="text-button" onClick={(event) => go('dashboard', '', event)}>Exit session</button><h1>Second Normal Form (2NF)</h1><p>Database Systems · One task at a time</p></div><div className="study-progress-summary"><span>Stage {stage + 1} of {studyStages.length} · {studyStages[stage]}</span><ProgressBar value={(stage + 1) / studyStages.length * 100} label="Study session stage progress" /></div></div>
    <StudyStepper stage={stage} />
    <div className="study-stage-wrap">
      {stage === 0 && <UnderstandStage preferences={preferences} mode={mode} setMode={setMode} next={next} onSource={onSource} onReport={onReport} />}
      {stage === 1 && <ExampleStage next={next} previous={previous} onSource={onSource} onReport={onReport} />}
      {stage === 2 && <CheckStage next={next} previous={previous} goUnderstand={() => { setMode('simple'); setStage(0) }} />}
      {stage === 3 && <PracticeStage next={next} previous={previous} />}
      {stage === 4 && <CompleteStage go={go} restart={() => setStage(0)} />}
    </div>
  </div>
}

function TutorPage({ onSource, onReport, go, hash }) {
  const questionRef = useRef(null)
  const [input, setInput] = useState('')
  const [message, setMessage] = useState(() => {
    const seededQuestion = hash === '#answer' ? 'Explain 2NF step by step'
      : hash === '#missing' ? 'What did our lecturer say about MongoDB?'
        : hash === '#functional' ? 'Explain functional dependencies'
          : hash === '#plsql' ? 'Help me practise PL/SQL' : ''
    if (!seededQuestion) return null
    const response = tutorResponseFor(seededQuestion)
    return response ? { type: 'answer', question: seededQuestion, response } : { type: 'missing', question: seededQuestion }
  })
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)
  const responseTimer = useRef(null)
  const loading = Boolean(pendingQuestion)
  useEffect(() => () => window.clearTimeout(responseTimer.current), [])
  const prompts = ['Explain 2NF step by step', 'What’s the difference between 2NF and 3NF?', 'Give me another example of partial dependency', 'Quiz me on normalization']

  function submit(text = input) {
    const question = text.trim()
    if (!question || loading) return
    setInput(question)
    setPendingQuestion(question)
    setShowCelebration(false)
    setMessage(null)
    responseTimer.current = window.setTimeout(() => {
      const response = tutorResponseFor(question)
      setMessage(response ? { type: 'answer', question, response } : { type: 'missing', question })
      setShowCelebration(Boolean(response))
      setPendingQuestion('')
    }, 600)
  }

  return <div className="page-stack tutor-page">
    <PageHeading title="Ask Ollie" description="Work through a Database Systems concept with examples and course references." />
    <div className="tutor-layout">
      <aside className="tutor-tools" aria-labelledby="tutor-context">
        <div className="workspace-summary-heading"><span className="course-monogram">DB</span><div><h2 id="tutor-context">Database Systems</h2><p>CSCI235 · Sample course</p></div></div>
        <div className="suggested-prompts"><span>Try asking</span><div>{prompts.map((prompt) => <button key={prompt} disabled={loading} onClick={() => submit(prompt)}>{prompt}</button>)}</div></div>
        <button className="text-button" disabled={loading} onClick={() => submit('What did our lecturer say about MongoDB?')}>Try a question without a source</button>
      </aside>
      <section className="tutor-shell" aria-label="Tutor conversation">
      <header className="conversation-header"><Ollie expression="hi" size={36} /><div><h2>Ollie</h2><p>Database Systems tutor</p></div></header>
      <div className="conversation" aria-busy={loading}>
        <p className="visually-hidden" aria-live="polite">{message ? (message.type === 'answer' ? `Answer ready for: ${message.question}` : 'No sample answer found. Try another topic.') : ''}</p>
        {!message && !loading && <div className="tutor-welcome"><Ollie expression="hi" size={72} /><h2>What would you like to understand?</h2><p>Start with a suggested Database Systems question. Ollie will show a sample answer and the lecture or tutorial it refers to.</p></div>}
        {(pendingQuestion || message) && <div className="user-bubble"><small>You asked</small><p>{pendingQuestion || message.question}</p></div>}
        {loading && <OllieLoading thinkingMessage="Ollie is connecting the dots…">Checking sample course references…</OllieLoading>}
        {message && (message.type === 'answer' ? <article className="tutor-answer"><header><span className="tutor-completion-icon"><Icon name="source" size={18} />{showCelebration && <OllieCompletion />}</span><div><small>Sample answer</small><h2>{message.response.title}</h2></div></header><p>{message.response.body}</p><ol>{message.response.points.map((point) => <li key={point}>{point}</li>)}</ol><div className="tutor-answer-sources"><span>Sources</span>{message.response.sources.map(([file, location]) => <SourceButton key={`${file}-${location}`} file={file} location={location} onOpen={onSource} />)}</div><footer><span><Icon name="check" size={14} />References from the sample course</span><button onClick={onReport}>Report incorrect answer</button></footer></article>
          : <article className="tutor-missing"><Ollie expression="tip" size={50} /><div><h2>No matching sample answer yet</h2><p>Try a question about normalization, functional dependencies, or PL/SQL. Those topics have answers with course references in this demo.</p><div><Button variant="secondary" onClick={() => { setInput(''); setMessage(null); questionRef.current?.focus() }}>Search another topic</Button><Button variant="quiet" onClick={(event) => go('course', '', event)}>View course materials</Button></div></div></article>)}
      </div>
      <p className="visually-hidden" role="status">{loading ? 'Checking sample course references…' : ''}</p>
      <form className="tutor-composer" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <label htmlFor="tutor-question">Your question</label>
        <input id="tutor-question" ref={questionRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="For example, what is 2NF?" />
        <Button type="submit" disabled={!input.trim() || loading}>Ask Tutorly</Button>
      </form>
      </section>
    </div>
  </div>
}

function ProgressPage({ progress, sessionComplete, go }) {
  const mastery = topics.filter((item) => ['Second Normal Form', 'SQL JOINs', 'ER Diagrams', 'PL/SQL'].includes(item.name)).map((item) => ({ ...item, mastery: item.name === 'Second Normal Form' ? 83 : item.mastery }))
  const nextFocus = sessionComplete
    ? { title: 'Functional Dependencies', copy: 'Your 2NF session is complete. Strengthening determinants and dependency notation is the clearest next step.', action: 'Start Functional Dependencies', hash: '#functional' }
    : { title: 'PL/SQL', copy: 'Your 54% topic understanding is improving. A short practice session on stored procedures is the clearest next step.', action: 'Start PL/SQL Practice', hash: '#plsql' }
  return <div className="page-stack progress-page"><PageHeading title="Your study progress" description="See what you’ve covered in Database Systems and choose your next practice topic." />
    <section className="progress-overview" aria-labelledby="course-progress-title">
      <div><span className="course-monogram">DB</span><div><h2 id="course-progress-title">Database Systems</h2><p>CSCI235 · Semester 2</p></div></div>
      <div className="progress-score"><p><strong>{progress}%</strong> complete</p><ProgressBar value={progress} label="Database Systems completion" /></div>
    </section>
    <section className="mastery-panel"><div className="section-heading-row"><div><h2>Topic understanding</h2><p>Illustrative values from study and quiz activity</p></div></div><div className="mastery-list">{mastery.map((item) => <article key={item.name}><div><strong>{item.name}</strong><span>{item.mastery}%</span></div><ProgressBar value={item.mastery} label={`${item.name} mastery`} /></article>)}</div></section>
    <section className="next-progress-focus"><span><Icon name="study" size={22} /></span><div><small>Recommended next focus</small><h2>{nextFocus.title}</h2><p>{nextFocus.copy}</p></div><Button variant="secondary" onClick={(event) => go('tutor', nextFocus.hash, event)}>{nextFocus.action}</Button></section>
  </div>
}

function ChoiceGroup({ label, options, value, onChange, descriptions = {} }) {
  return <fieldset className="settings-group"><legend>{label}</legend><div>{options.map((option) => <button type="button" key={option} className={value === option ? 'active' : ''} aria-pressed={value === option} onClick={() => onChange(option)}><span><strong>{option}</strong>{descriptions[option] && <small>{descriptions[option]}</small>}</span>{value === option && <Icon name="check" size={17} />}</button>)}</div></fieldset>
}

function SettingsPage({ preferences, setPreferences }) {
  const [saved, setSaved] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(readTransitionSound)
  function setSound(value) {
    const enabled = value === 'On'
    writeTransitionSound(enabled)
    setSoundEnabled(enabled)
  }
  function set(key, value) { setPreferences((current) => ({ ...current, [key]: value })); setSaved(false) }
  function toggleResource(resource) { setPreferences((current) => ({ ...current, resources: current.resources.includes(resource) ? current.resources.filter((item) => item !== resource) : [...current.resources, resource] })); setSaved(false) }
  return <div className="page-stack settings-page"><PageHeading title="Learn your way" description="Choose how to present your lessons and what to prioritise during study." />
    <section className="diagnosis-note"><span><Icon name="tutor" size={21} /></span><p>These choices are available to everyone. Choose what helps you today and change it whenever you like.</p></section>
    <section className="settings-panel" aria-labelledby="preferences-title">
      <header className="preferences-header"><span className="panel-icon"><Icon name="settings" size={23} /></span><div><h2 id="preferences-title">Study preferences</h2><p>Adjust lesson detail, teaching style, and preferred resources.</p></div></header>
      <ChoiceGroup label="Explanation length" options={['Short', 'Balanced', 'Detailed']} descriptions={{ Short: 'Focus on the essentials', Balanced: 'Follow the main steps', Detailed: 'Include why each step matters' }} value={preferences.explanation} onChange={(value) => set('explanation', value)} /><ChoiceGroup label="Teaching style" options={['Step-by-step', 'Examples first', 'Visual first']} descriptions={{ 'Step-by-step': 'Take one idea at a time', 'Examples first': 'Start with a worked problem', 'Visual first': 'Start with a diagram or layout' }} value={preferences.teaching} onChange={(value) => set('teaching', value)} /><ChoiceGroup label="Information density" options={['Low', 'Standard']} value={preferences.density} onChange={(value) => set('density', value)} /><ChoiceGroup label="Knowledge checks" options={['Frequent', 'Standard']} value={preferences.checks} onChange={(value) => set('checks', value)} /><fieldset className="settings-group resources"><legend>Preferred resources</legend><div>{['Text', 'Worked examples', 'Flashcards', 'Practice questions', 'Video'].map((resource) => <button type="button" key={resource} className={preferences.resources.includes(resource) ? 'active' : ''} aria-pressed={preferences.resources.includes(resource)} onClick={() => toggleResource(resource)}>{resource}{preferences.resources.includes(resource) && <Icon name="check" size={15} />}</button>)}</div></fieldset></section>
    <section className="settings-panel">
      <ChoiceGroup label="Interface sound" options={['On', 'Off']} value={soundEnabled ? 'On' : 'Off'} onChange={setSound} />
    </section>
    <div className="settings-footer"><span>Explanation length and density apply in the sample lesson. Other choices are saved as demo preferences.</span><Button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200) }}>{saved ? 'Preferences Saved' : 'Save Preferences'}</Button></div>
    {saved && <div className="save-toast" role="status"><Icon name="check" size={17} />Learning preferences saved for this prototype</div>}
  </div>
}

function Modal({ title, children, onClose, actions, returnFocus }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  const previousTitle = useRef(title)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    if (previousTitle.current !== title) {
      previousTitle.current = title
      dialogRef.current?.querySelector('h2')?.focus()
    }
  }, [title])
  useEffect(() => {
    const trigger = returnFocus.current
    const originalOverflow = document.body.style.overflow
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter((item) => !item.disabled)
    document.body.style.overflow = 'hidden'
    focusable()[0]?.focus()
    function handleKeydown(event) {
      if (event.key === 'Escape') { closeRef.current(); return }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement?.id === 'modal-title')) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = originalOverflow
      window.requestAnimationFrame(() => trigger?.focus())
    }
  }, [returnFocus])
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title" tabIndex={-1}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header><div className="modal-body">{children}</div>{actions && <footer>{actions}</footer>}</section></div>
}

function App() {
  const [{ view, hash }, setRoute] = useState(readRoute)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [focusHost, setFocusHost] = useState(null)
  const [focusOpened, setFocusOpened] = useState(false)
  const attachFocusHost = useCallback((node) => {
    setFocusHost(node)
    if (node) setFocusOpened(true)
  }, [])
  const [files, setFiles] = useState(initialFiles)
  const portal = useRef(null)
  useEffect(listenForPagePresses, [])
  useEffect(() => {
    const transition = createPortalTransition({
      getRevealElements: () => Array.from(document.querySelectorAll(
        '.app-content .page-heading, .app-content .page-stack > section, ' +
        '.dashboard-layout > section, .dashboard-overview > section, .materials-layout > section, ' +
        '.study-heading, .study-stage-wrap, .tutor-layout, .intro-copy, .intro-preview',
      )).filter((element) => {
        const { top, bottom } = element.getBoundingClientRect()
        return bottom > 0 && top < window.innerHeight
      }),
    })
    portal.current = transition
    return () => {
      portal.current = null
      transition.destroy()
    }
  }, [])
  const uploadBatch = useRef(0)
  const uploadTimers = useRef(new Set())
  useEffect(() => {
    const timers = uploadTimers.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  function onAddFiles(fileList) {
    const batchId = ++uploadBatch.current
    const incoming = Array.from(fileList || []).map((file, index) => ({ name: file.name, type: 'Uploaded file', size: `${Math.max(.1, file.size / 1024 / 1024).toFixed(1)} MB`, status: 'Uploaded', id: `${batchId}-${index}` }))
    if (!incoming.length) return
    setFiles((current) => [...incoming, ...current])
    const fileIds = new Set(incoming.map((file) => file.id))
    for (const [status, delay] of [['Processing', 650], ['Ready', 1550]]) {
      const timer = window.setTimeout(() => {
        uploadTimers.current.delete(timer)
        setFiles((current) => current.map((file) => fileIds.has(file.id) ? { ...file, status } : file))
      }, delay)
      uploadTimers.current.add(timer)
    }
  }

  const [studyStage, setStudyStage] = useState(() => stageFromHash(hash) ?? 0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [preferences, setPreferences] = useState(defaultPreferences)
  const dialogTrigger = useRef(null)
  const [sourceModal, setSourceModal] = useState(null)
  const [reportModal, setReportModal] = useState(false)
  const [paywallAction, setPaywallAction] = useState(null)
  const [reportSent, setReportSent] = useState(false)
  const progress = sessionComplete ? 72 : 68

  useEffect(() => {
    function onPopState() {
      const route = readRoute()
      const stage = route.view === 'study' ? stageFromHash(route.hash) : null
      setRoute(route)
      if (stage !== null) setStudyStage(stage)
      setMobileOpen(false)
      setSourceModal(null)
      setReportModal(false)
      setPaywallAction(null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const showUpload = view === 'course' && hash === '#upload'
  useEffect(() => {
    if (showUpload) {
      document.getElementById('upload')?.scrollIntoView()
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    const heading = document.querySelector(view === 'study' ? '.study-card h2' : 'h1')
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }) }
  }, [view, studyStage, showUpload])

  function go(nextView, nextHash = '', event) {
    const currentRoute = readRoute()
    if (!event?.currentTarget || currentRoute.view !== 'intro' || nextView === 'intro' || !portal.current) {
      portal.current?.cancel()
      commitRoute(nextView, nextHash)
      return
    }
    // The existing route and its focus effects must commit before the aperture opens.
    void portal.current.navigate(event, event.currentTarget, () => {
      flushSync(() => commitRoute(nextView, nextHash))
    })
  }

  function commitRoute(nextView, nextHash) {
    const stage = nextView === 'study' ? stageFromHash(nextHash) : null
    if (stage !== null) setStudyStage(stage)
    setRoute({ view: nextView, hash: nextHash })
    setMobileOpen(false)
    const url = nextView === 'intro' ? window.location.pathname : `${window.location.pathname}?view=${nextView}${nextHash}`
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.pushState(null, '', url)
    }
  }

  function changeStudyStage(stage) {
    setStudyStage(stage)
    const nextHash = `#stage-${stage}`
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    setRoute({ view: 'study', hash: nextHash })
  }

  function requestPaywall(action) {
    dialogTrigger.current = document.activeElement
    setPaywallAction(() => action)
  }

  function openSource(source, trigger) {
    dialogTrigger.current = trigger
    setSourceModal(source)
  }

  function openReport(event) {
    dialogTrigger.current = event.currentTarget
    setReportSent(false)
    setReportModal(true)
  }

  const page = view === 'dashboard' ? <Dashboard go={go} sessionComplete={sessionComplete} progress={progress} paywall={requestPaywall} files={files} studyStage={studyStage} />
    : view === 'course' ? <CoursePage files={files} onAddFiles={onAddFiles} go={go} />
      : view === 'study' ? <StudyPage go={go} stage={studyStage} setStage={changeStudyStage} preferences={preferences} onSource={openSource} onReport={openReport} markComplete={() => setSessionComplete(true)} />
        : view === 'tutor' ? <TutorPage key={hash} hash={hash} onSource={openSource} onReport={openReport} go={go} />
          : view === 'progress' ? <ProgressPage progress={progress} sessionComplete={sessionComplete} go={go} />
            : view === 'focus' ? <div ref={attachFocusHost} />
              : view === 'leaderboards' ? <StudyLeaderboards />
                : <SettingsPage preferences={preferences} setPreferences={setPreferences} />

  return <>
    <div className="app-root-content" inert={sourceModal || reportModal || paywallAction ? true : undefined}>
      {view === 'intro' ? <Intro go={go} openSample={(event) => go('study', '#stage-0', event)} /> : <AppShell view={view} go={go} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} progress={progress}>{page}</AppShell>}
      {focusOpened && <FocusMode host={focusHost} onExit={() => go('dashboard')} menuOpen={mobileOpen} />}
    </div>
    {paywallAction && <Paywall returnFocus={dialogTrigger} onClose={() => setPaywallAction(null)} onContinue={(event) => { const action = paywallAction; setPaywallAction(null); action?.(event) }} />}
    {sourceModal && <Modal returnFocus={dialogTrigger} title="Course source preview" onClose={() => setSourceModal(null)} actions={<Button onClick={() => setSourceModal(null)}>Done</Button>}><div className="source-preview"><span className="file-icon large"><Icon name="file" size={23} /></span><div><strong>{sourceModal.file}</strong><p>{sourceModal.location}</p><small>Sample reference from the Database Systems course.</small></div></div></Modal>}
    {reportModal && <Modal returnFocus={dialogTrigger} title={reportSent ? 'Report received' : 'Report incorrect answer'} onClose={() => setReportModal(false)} actions={reportSent ? <Button onClick={() => setReportModal(false)}>Done</Button> : <><Button variant="secondary" onClick={() => setReportModal(false)}>Cancel</Button><Button onClick={() => setReportSent(true)}>Send Report</Button></>}><div className="report-form">{reportSent ? <p role="status">Your report was recorded in this demo.</p> : <fieldset className="report-options"><legend>What seemed incorrect or unclear?</legend><label><input type="radio" name="issue" defaultChecked />The explanation does not match the source</label><label><input type="radio" name="issue" />The source reference is wrong</label><label><input type="radio" name="issue" />The explanation is unclear</label></fieldset>}</div></Modal>}
  </>
}

export default App
