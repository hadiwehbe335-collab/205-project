import { useEffect, useRef, useState } from 'react'
import Icon from './components/Icon'
import { materials as seededMaterials, priorities, topics } from './data'

const navigation = [
  ['dashboard', 'Dashboard', 'dashboard'],
  ['course', 'My Course', 'courses'],
  ['study', 'Study', 'study'],
  ['tutor', 'Tutor', 'tutor'],
  ['progress', 'Progress', 'progress'],
  ['settings', 'Settings', 'settings'],
]

const viewTitles = {
  dashboard: 'Dashboard', course: 'Database Systems', study: 'Study Session',
  tutor: 'Tutorly AI', progress: 'Progress', settings: 'Learning Preferences',
}

const studyStages = ['Understand', 'Example', 'Check', 'Practice', 'Complete']

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

function Brand({ light = false, onClick }) {
  const content = <><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>Tutorly</span></>
  if (onClick) return <button className={`brand ${light ? 'brand-light' : ''}`} onClick={onClick} aria-label="Go to Tutorly dashboard">{content}</button>
  return <div className={`brand ${light ? 'brand-light' : ''}`}>{content}</div>
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

function Paywall({ onClose, onContinue }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const originalOverflow = document.body.style.overflow
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll('button') || []).filter((item) => !item.disabled)
    document.body.style.overflow = 'hidden'
    focusable()[0]?.focus()
    function keydown(event) {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = originalOverflow; previous?.focus?.() }
  }, [onClose])
  return <div className="modal-layer paywall-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} className="modal paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title"><header><span className="paywall-stamp">ONE TIME ACCESS</span><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header><div className="modal-body"><span className="paywall-price">$100</span><h2 id="paywall-title">Unlock this action?</h2><p>That’s $100 for one use. Your wallet has been notified.</p><small>Relax — this is a prototype joke. Nothing will be charged.</small></div><footer><Button variant="secondary" onClick={onClose}>Maybe later</Button><Button onClick={onContinue}>Buy for $100 · Continue</Button></footer></section></div>
}

function ProgressBar({ value, label }) {
  return <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value} aria-label={label}><span style={{ width: `${value}%` }} /></div>
}

function SourceButton({ file, location, onOpen }) {
  return <button className="source-reference" onClick={() => onOpen({ file, location })}>
    <Icon name="source" size={17} />
    <span><strong>{file}</strong><small>{location}</small></span>
  </button>
}

function Intro({ go }) {
  return <div className="intro-page">
    <header className="intro-header"><Brand /><span className="prototype-badge">Interactive university prototype</span></header>
    <main className="intro-main">
      <section className="intro-copy">
        <h1>Your course. Your AI tutor. <span>Your way of learning.</span></h1>
        <p>Turn your lectures, tutorials and labs into a personalized learning experience.</p>
        <Button onClick={() => go('dashboard')} className="intro-action">Open Tutorly</Button>
        <small>Front-end demonstration · Mocked course data</small>
      </section>
    </main>
  </div>
}

function AppShell({ view, go, children, mobileOpen, setMobileOpen, progress }) {
  const sidebarRef = useRef(null)
  useEffect(() => {
    if (!mobileOpen) return undefined
    const previous = document.activeElement
    const sidebar = sidebarRef.current
    const focusable = () => Array.from(sidebar?.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])') || []).filter((item) => !item.disabled)
    focusable()[0]?.focus()
    function handleKeydown(event) {
      if (event.key === 'Escape') { setMobileOpen(false); return }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => { document.removeEventListener('keydown', handleKeydown); previous?.focus?.() }
  }, [mobileOpen, setMobileOpen])

  return <div className="app-shell">
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside ref={sidebarRef} id="primary-navigation" className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-head"><Brand light onClick={() => go('dashboard')} /><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><Icon name="close" /></button></div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(([id, label, icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => { go(id); setMobileOpen(false) }}><Icon name={icon} size={19} /><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-course">
        <div><span className="course-monogram small">DB</span><span><strong>Database Systems</strong><small>CSCI235 · Course ready</small></span></div>
        <ProgressBar value={progress} label="Database Systems progress" />
      </div>
      <button className="student-card" onClick={() => go('settings')}><span className="avatar">HA</span><span><strong>Hadi Ahmed</strong><small>Learning preferences</small></span></button>
    </aside>
    <div className="app-column" inert={mobileOpen ? true : undefined}>
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Icon name="menu" /></button><div><small>Tutorly workspace</small><strong>{viewTitles[view]}</strong></div></div>
        <div className="topbar-right"><span className="course-status"><span /> Course ready</span><button className="avatar-button" onClick={() => go('settings')} aria-label="Open learning preferences">HA</button></div>
      </header>
      <main className={`app-content ${view === 'study' ? 'study-content' : ''}`}>{children}</main>
    </div>
  </div>
}

function PageHeading({ title, description, actions }) {
  return <div className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>
}

function Dashboard({ go, sessionComplete, progress, paywall }) {
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
    <PageHeading title="Good afternoon, Hadi" description="Database Systems · Here is the clearest next step from your course." actions={<Button variant="secondary" onClick={() => go('course')}>View course material</Button>} />
    <div className="dashboard-layout">
      <section className="continue-study">
        <div className="continue-top"><span className="section-label">{nextTopic.eyebrow}</span><span className="priority-chip high">High Priority</span></div>
        <div className="continue-topic"><span className="topic-mark"><Icon name="study" size={25} /></span><div><small>{nextTopic.category}</small><h2>{nextTopic.title}</h2><p>{nextTopic.description}</p></div></div>
        <div className="course-progress"><div><span>{sessionComplete ? 'Course progress' : 'Topic progress'}</span><strong>{progress}%</strong></div><ProgressBar value={progress} label={sessionComplete ? 'Database Systems progress' : 'Second Normal Form progress'} /></div>
        {sessionComplete && <div className="progress-update"><Icon name="check" size={17} />Last session completed · Functional Dependencies is ready next.</div>}
        <Button onClick={() => paywall(() => sessionComplete ? go('tutor', '#functional') : go('study'))} className="continue-button">{nextTopic.action}</Button>
        <div className="continue-sources"><Icon name="source" size={16} /><span>{sessionComplete ? 'Grounded in Lecture 04 and Tutorial 04' : 'Built from Lecture 04 and Tutorial 04'}</span></div>
      </section>

      <section className="recommendations">
        <div className="section-heading-row"><div><h2>Recommended Next</h2><p>Revision priorities from course emphasis</p></div><span className="tooltip-wrap"><button className="icon-button info-button" aria-label="How revision priorities work"><Icon name="info" size={18} /></button><span className="tooltip">Revision priorities are estimated from how strongly topics appear across your uploaded lectures, tutorials, labs, examples and practice material. Tutorly cannot guarantee what will appear in an assessment.</span></span></div>
        <div className="recommendation-list">{recommendations.map((item) => <button key={item.topic} onClick={() => item.topic === 'Second Normal Form' ? go('study') : go('progress')}><span><strong>{item.topic}</strong><small>{item.evidence}</small></span><span className={`priority-chip ${item.level.startsWith('High') ? 'high' : 'medium'}`}>{item.level}</span></button>)}</div>
        <p className="priority-disclaimer"><Icon name="info" size={15} />Priority is guidance, not an assessment prediction.</p>
      </section>
    </div>

    <section className="recent-materials">
      <div className="section-heading-row"><div><h2>Recent course material</h2><p>Five files are organized and ready for study.</p></div><button className="text-button" onClick={() => go('course')}>Manage materials</button></div>
      <div className="recent-row">
        {initialFiles.slice(0, 3).map((file) => <article key={file.name}><span className="file-icon"><Icon name="file" size={18} /></span><span><strong>{file.name}</strong><small>{file.type} · Ready</small></span></article>)}
      </div>
    </section>
  </div>
}

function CoursePage({ files, setFiles }) {
  const inputRef = useRef(null)
  const timersRef = useRef([])
  useEffect(() => () => timersRef.current.forEach(window.clearTimeout), [])

  function simulateFiles(fileList) {
    const incoming = Array.from(fileList || []).map((file, index) => ({ name: file.name, type: 'Uploaded file', size: `${Math.max(.1, file.size / 1024 / 1024).toFixed(1)} MB`, status: 'Uploaded', id: `${Date.now()}-${index}` }))
    if (!incoming.length) return
    setFiles((current) => [...incoming, ...current])
    timersRef.current.push(window.setTimeout(() => setFiles((current) => current.map((file) => incoming.some((item) => item.id === file.id) ? { ...file, status: 'Processing' } : file)), 650))
    timersRef.current.push(window.setTimeout(() => setFiles((current) => current.map((file) => incoming.some((item) => item.id === file.id) ? { ...file, status: 'Ready' } : file)), 1550))
  }

  const readyCount = files.filter((file) => file.status === 'Ready').length
  return <div className="page-stack course-page">
    <PageHeading title="Database Systems" description="CSCI235 · Your uploaded course material, organized into one study workspace." actions={<Button onClick={() => inputRef.current?.click()}>Add Course Material</Button>} />
    <input ref={inputRef} hidden type="file" multiple onChange={(event) => simulateFiles(event.target.files)} />

    <section className="course-ready-banner"><span className="ready-icon"><Icon name="check" size={22} /></span><div><h2>Course ready</h2><p>Material is organized for this simulated prototype.</p></div><div className="ready-facts"><span><strong>23</strong> topics identified</span><span><strong>{readyCount}</strong> files indexed</span></div></section>

    <div className="materials-layout">
      <section className="upload-card" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); simulateFiles(event.dataTransfer.files) }}>
        <span className="upload-icon"><Icon name="upload" size={25} /></span><h2>Add Course Material</h2><p>Drag in a lecture, tutorial, lab, reading, learning objective, or permitted practice paper.</p><Button variant="secondary" onClick={() => inputRef.current?.click()}>Choose files</Button><div><span>PDF</span><span>PPTX</span><span>DOCX</span></div><small>Files are simulated locally and are not parsed.</small>
      </section>
      <section className="materials-panel">
        <div className="section-heading-row"><div><h2>Course files</h2><p>{files.length} materials in this workspace</p></div><div className="status-legend"><span><i className="uploaded" />Uploaded</span><span><i className="processing" />Processing</span><span><i className="ready" />Ready</span></div></div>
        <div className="material-list">{files.map((file, index) => <article key={file.id || `${file.name}-${index}`}><span className="file-icon"><Icon name="file" size={18} /></span><span className="material-name"><strong>{file.name}</strong><small>{file.type} · {file.size}</small></span><span className={`file-status ${file.status.toLowerCase()}`}>{file.status}{file.status === 'Ready' && <Icon name="check" size={14} />}</span></article>)}</div>
      </section>
    </div>

    <section className="pipeline-note"><div><Icon name="spark" size={20} /><span><strong>Future course-grounding workflow</strong>This prototype represents the result of processing, sectioning, indexing, retrieval and source-cited generation. No live AI pipeline is running.</span></div><div className="pipeline-flow"><span>Upload</span><i /><span>Organize</span><i /><span>Retrieve</span><i /><span>Answer + sources</span></div></section>
  </div>
}

function StudyStepper({ stage }) {
  return <div className="study-stepper" aria-label={`Study stage ${stage + 1} of ${studyStages.length}: ${studyStages[stage]}`}>{studyStages.map((item, index) => <div key={item} className={`${index === stage ? 'active' : ''} ${index < stage ? 'complete' : ''}`}><span>{index < stage ? <Icon name="check" size={13} /> : index + 1}</span><strong>{item}</strong>{index < studyStages.length - 1 && <i />}</div>)}</div>
}

function SourceStrip({ onOpen, onReport, compact = false }) {
  return <div className={`study-source-strip ${compact ? 'compact' : ''}`}><div><span className="source-strip-title"><Icon name="source" size={17} />Sources</span><div className="source-buttons"><SourceButton file="Lecture 04 - Normalization.pdf" location="Slide 17" onOpen={onOpen} /><SourceButton file="Tutorial 04 - Normalization.docx" location="Question 3" onOpen={onOpen} /></div></div><div className="source-strip-actions"><span><Icon name="check" size={14} />Grounded in 2 course sources</span><button onClick={onReport}>Report incorrect answer</button></div></div>
}

function UnderstandStage({ preferences, mode, setMode, next, onSource, onReport }) {
  const simple = mode === 'simple'
  const detailed = mode === 'detail' || preferences.explanation === 'Detailed'
  const steps = simple
    ? ['Start with a table that is already in 1NF.', 'Look for a composite key.', 'Move anything that depends on only part of that key.']
    : ['A table must already be in First Normal Form.', 'Check whether the table has a composite key.', 'Check whether a non-key attribute depends on only part of that key.', 'Move the partial dependency into a separate table.']
  return <article className="study-card understand-card">
    <header className="study-card-header"><span className="study-icon"><Icon name="courses" size={22} /></span><div><small>Understand the idea</small><h2>Second Normal Form</h2></div><span className="preference-summary">{preferences.explanation} · {preferences.density} density</span></header>
    {simple && <div className="simple-summary"><strong>In simple terms</strong><p>2NF makes sure every detail belongs to the whole key, not just one part of it.</p></div>}
    <div className="lesson-steps">{steps.map((step, index) => <section key={step}><span>{index + 1}</span><p>{step}</p></section>)}</div>
    {detailed && <div className="detail-note"><strong>Why this matters</strong><p>Partial dependencies repeat facts such as student names or course names across many enrollment rows. Separating them reduces duplication and update errors.</p></div>}
    {preferences.density === 'Standard' && !detailed && <div className="detail-note quiet"><strong>Key check</strong><p>Partial dependencies only become possible when a candidate key contains more than one attribute.</p></div>}
    <div className="study-choice-actions"><Button variant={simple ? 'selected' : 'secondary'} onClick={() => setMode('simple')}>Explain more simply</Button><Button variant={detailed ? 'selected' : 'secondary'} onClick={() => setMode('detail')}>Show more detail</Button><Button variant="quiet" onClick={next}>Give me an example</Button></div>
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
  const correct = answer === 'partial'
  const options = [
    ['whole', 'StudentName depends on the whole composite key.'],
    ['partial', 'StudentName depends on StudentID, only part of the key.'],
    ['foreign', 'StudentName should be used as a foreign key.'],
  ]
  return <article className="study-card check-stage">
    <header className="study-card-header"><span className="study-icon amber"><Icon name="quiz" size={22} /></span><div><small>Quick knowledge check</small><h2>Why is StudentID → StudentName a problem when the key is (StudentID, CourseID)?</h2></div></header>
    <div className="check-options">{options.map(([id, text]) => <button key={id} onClick={() => setAnswer(id)} disabled={Boolean(answer)} className={`${answer === id ? 'selected' : ''} ${answer && id === 'partial' ? 'correct' : ''} ${answer === id && id !== 'partial' ? 'incorrect' : ''}`}><span>{String.fromCharCode(65 + options.findIndex((item) => item[0] === id))}</span>{text}{answer && id === 'partial' && <Icon name="check" size={18} />}</button>)}</div>
    {answer && <div className={`answer-feedback ${correct ? 'correct' : 'incorrect'}`} role="status"><strong>{correct ? 'Correct' : 'Not quite — let’s look at it again.'}</strong><p>{correct ? 'StudentName depends on only one part of the composite key, so it is a partial dependency.' : 'The issue is not the attribute itself. It is that StudentName does not need CourseID to be determined.'}</p>{!correct && <div><Button variant="secondary" onClick={goUnderstand}>Explain differently</Button><Button variant="quiet" onClick={previous}>Show another example</Button></div>}</div>}
    <div className="stage-nav"><Button variant="secondary" onClick={previous}>Back</Button><Button onClick={next} disabled={!correct}>Continue to practice</Button></div>
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
    {reveal && <div className={`practice-reveal ${reveal}`}><strong>{reveal === 'hint' ? 'Hint' : 'Suggested answer'}</strong><p>{reveal === 'hint' ? 'Ask whether StudentName needs CourseID, and whether CourseName needs StudentID.' : 'StudentID → StudentName and CourseID → CourseName are partial dependencies. Create STUDENT(StudentID, StudentName), COURSE(CourseID, CourseName), and ENROLLMENT(StudentID, CourseID).'}</p></div>}
    <div className="based-on"><Icon name="source" size={17} /><span><strong>Based on</strong>Lecture 04 + Tutorial 04</span><small>Generated practice · not a predicted assessment question</small></div>
    <div className="stage-nav"><Button variant="secondary" onClick={previous}>Back</Button><Button onClick={next}>Complete session</Button></div>
  </article>
}

function CompleteStage({ go, restart }) {
  return <article className="study-card complete-stage">
    <span className="complete-mark"><Icon name="check" size={30} /></span><h2>Session Complete</h2><p>You reviewed Second Normal Form using your Database Systems course material.</p>
    <div className="completion-list"><span><Icon name="check" size={16} />1 explanation</span><span><Icon name="check" size={16} />1 worked example</span><span><Icon name="check" size={16} />1 knowledge check</span><span><Icon name="check" size={16} />1 practice question</span></div>
    <div className="confidence"><span>Topic confidence</span><strong>Good</strong><div><i /><i /><i className="muted" /><i className="muted" /></div></div>
    <section className="next-focus"><small>Recommended Next</small><h3>Functional Dependencies</h3><p>Strengthen determinants and dependency notation before moving to Third Normal Form.</p></section>
    <div className="complete-actions"><Button onClick={() => { restart(); go('tutor', '#functional') }}>Continue Learning</Button><Button variant="secondary" onClick={() => go('dashboard')}>Back to Dashboard</Button></div>
  </article>
}

function StudyPage({ go, stage, setStage, preferences, onSource, onReport, markComplete }) {
  const [mode, setMode] = useState(preferences.explanation === 'Detailed' ? 'detail' : 'balanced')
  function next() { const nextStage = Math.min(stage + 1, 4); setStage(nextStage); if (nextStage === 4) markComplete() }
  function previous() { setStage(Math.max(stage - 1, 0)) }
  return <div className="study-page">
    <div className="study-heading"><div><button className="text-button" onClick={() => go('dashboard')}>Exit session</button><h1>Second Normal Form (2NF)</h1><p>Database Systems · One task at a time</p></div><span>Stage {stage + 1} of 5</span></div>
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

function TutorPage({ onSource, onReport, go }) {
  const [input, setInput] = useState('')
  const [message, setMessage] = useState(() => {
    const seededQuestion = window.location.hash === '#answer' ? 'Explain 2NF step by step'
      : window.location.hash === '#missing' ? 'What did our lecturer say about MongoDB?'
        : window.location.hash === '#functional' ? 'Explain functional dependencies'
          : window.location.hash === '#plsql' ? 'Help me practise PL/SQL' : ''
    if (!seededQuestion) return null
    const response = tutorResponseFor(seededQuestion)
    return response ? { type: 'answer', question: seededQuestion, response } : { type: 'missing', question: seededQuestion }
  })
  const [loading, setLoading] = useState(false)
  const prompts = ['Explain 2NF step by step', 'What’s the difference between 2NF and 3NF?', 'Give me another example of partial dependency', 'Quiz me on normalization']

  function submit(text = input) {
    const question = text.trim()
    if (!question) return
    setInput(question); setLoading(true); setMessage(null)
    window.setTimeout(() => {
      const response = tutorResponseFor(question)
      setMessage(response ? { type: 'answer', question, response } : { type: 'missing', question })
      setLoading(false)
    }, 600)
  }

  return <div className="page-stack tutor-page">
    <PageHeading title="Tutorly AI — Database Systems" description="Ask about this course. Tutorly answers from your uploaded material and shows the sources it used." />
    <section className="tutor-shell">
      <div className="suggested-prompts"><span>Try asking</span><div>{prompts.map((prompt) => <button key={prompt} onClick={() => submit(prompt)}>{prompt}</button>)}</div></div>
      <div className="conversation" aria-live="polite">
        {!message && !loading && <div className="tutor-welcome"><span><Icon name="tutor" size={27} /></span><h2>Ask about Database Systems</h2><p>I’ll stay grounded in the five files currently in your course workspace.</p></div>}
        {loading && <div className="tutor-loading"><span /><span /><span /><small>Checking your course material…</small></div>}
        {message && <>
          <div className="user-bubble"><small>You asked</small><p>{message.question}</p></div>
          {message.type === 'answer' ? <article className="tutor-answer"><header><span><Icon name="spark" size={18} /></span><div><small>Tutorly AI</small><strong>{message.response.title}</strong></div></header><p>{message.response.body}</p><ol>{message.response.points.map((point) => <li key={point}>{point}</li>)}</ol><div className="tutor-answer-sources"><span>Sources</span>{message.response.sources.map(([file, location]) => <SourceButton key={`${file}-${location}`} file={file} location={location} onOpen={onSource} />)}</div><footer><span><Icon name="check" size={14} />Grounded in your course</span><button onClick={onReport}>Report incorrect answer</button></footer></article>
          : <article className="tutor-missing"><span><Icon name="search" size={23} /></span><div><h2>{message.question.toLowerCase().includes('mongodb') ? 'I couldn’t find enough information about MongoDB in your uploaded Database Systems material.' : `I couldn’t find enough course material to answer “${message.question}”.`}</h2><p>I won’t invent a course-specific answer without supporting material.</p><div><Button variant="secondary" onClick={() => { setInput(''); setMessage(null) }}>Search another topic</Button><Button variant="quiet" onClick={() => go('course')}>Upload more material</Button></div></div></article>}
        </>}
      </div>
      <form className="tutor-composer" onSubmit={(event) => { event.preventDefault(); submit() }}><input aria-label="Ask Tutorly" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question about Database Systems…" /><Button type="submit" disabled={!input.trim() || loading}>Ask Tutorly</Button></form>
      <button className="uncertainty-demo" onClick={() => submit('What did our lecturer say about MongoDB?')}>Demonstrate an unavailable-source response</button>
    </section>
  </div>
}

function ProgressPage({ progress, sessionComplete, go }) {
  const mastery = topics.filter((item) => ['Second Normal Form', 'SQL JOINs', 'ER Diagrams', 'PL/SQL'].includes(item.name)).map((item) => ({ ...item, mastery: item.name === 'Second Normal Form' ? 83 : item.mastery }))
  const nextFocus = sessionComplete
    ? { title: 'Functional Dependencies', copy: 'Your 2NF session is complete. Strengthening determinants and dependency notation is the clearest next step.', action: 'Start Functional Dependencies', hash: '#functional' }
    : { title: 'PL/SQL', copy: 'Your 54% topic understanding is improving. A short practice session on stored procedures is the clearest next step.', action: 'Start PL/SQL Practice', hash: '#plsql' }
  return <div className="page-stack progress-page"><PageHeading title="Database Systems Progress" description="Use progress to choose the next useful study action, not just to collect statistics." />
    <section className="progress-overview"><div><span className="course-monogram">DB</span><span><strong>Database Systems</strong><small>CSCI235 · Semester 2</small></span></div><div><span>{progress}% complete</span><ProgressBar value={progress} label="Database Systems completion" /></div></section>
    <section className="mastery-panel"><div className="section-heading-row"><div><h2>Topic understanding</h2><p>Illustrative values from study and quiz activity</p></div></div><div className="mastery-list">{mastery.map((item) => <article key={item.name}><div><strong>{item.name}</strong><span>{item.mastery}%</span></div><ProgressBar value={item.mastery} label={`${item.name} mastery`} /></article>)}</div></section>
    <section className="next-progress-focus"><span><Icon name="study" size={22} /></span><div><small>Recommended next focus</small><h2>{nextFocus.title}</h2><p>{nextFocus.copy}</p></div><Button variant="secondary" onClick={() => go('tutor', nextFocus.hash)}>{nextFocus.action}</Button></section>
  </div>
}

function ChoiceGroup({ label, options, value, onChange }) {
  return <fieldset className="settings-group"><legend>{label}</legend><div>{options.map((option) => <button type="button" key={option} className={value === option ? 'active' : ''} aria-pressed={value === option} onClick={() => onChange(option)}>{option}{value === option && <Icon name="check" size={15} />}</button>)}</div></fieldset>
}

function SettingsPage({ preferences, setPreferences }) {
  const [saved, setSaved] = useState(false)
  function set(key, value) { setPreferences((current) => ({ ...current, [key]: value })); setSaved(false) }
  function toggleResource(resource) { setPreferences((current) => ({ ...current, resources: current.resources.includes(resource) ? current.resources.filter((item) => item !== resource) : [...current.resources, resource] })); setSaved(false) }
  return <div className="page-stack settings-page"><PageHeading title="How should Tutorly teach you?" description="Choose how explanations and study activities should feel. These options are available to every student." />
    <section className="diagnosis-note"><span><Icon name="tutor" size={21} /></span><p>Tutorly adapts to how you prefer to learn. You do not need to provide a medical diagnosis.</p></section>
    <section className="settings-panel"><ChoiceGroup label="Explanation length" options={['Short', 'Balanced', 'Detailed']} value={preferences.explanation} onChange={(value) => set('explanation', value)} /><ChoiceGroup label="Teaching style" options={['Step-by-step', 'Examples first', 'Visual first']} value={preferences.teaching} onChange={(value) => set('teaching', value)} /><ChoiceGroup label="Information density" options={['Low', 'Standard']} value={preferences.density} onChange={(value) => set('density', value)} /><ChoiceGroup label="Knowledge checks" options={['Frequent', 'Standard']} value={preferences.checks} onChange={(value) => set('checks', value)} /><fieldset className="settings-group resources"><legend>Preferred resources</legend><div>{['Text', 'Worked examples', 'Flashcards', 'Practice questions', 'Video'].map((resource) => <button type="button" key={resource} className={preferences.resources.includes(resource) ? 'active' : ''} aria-pressed={preferences.resources.includes(resource)} onClick={() => toggleResource(resource)}>{resource}{preferences.resources.includes(resource) && <Icon name="check" size={15} />}</button>)}</div></fieldset></section>
    <div className="settings-footer"><span>Preferences immediately affect the Understand stage of the study session.</span><Button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200) }}>{saved ? 'Preferences Saved' : 'Save Preferences'}</Button></div>
    {saved && <div className="save-toast" role="status"><Icon name="check" size={17} />Learning preferences saved for this prototype</div>}
  </div>
}

function Modal({ title, children, onClose, actions }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement
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
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = originalOverflow
      previous?.focus?.()
    }
  }, [])
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header><div className="modal-body">{children}</div>{actions && <footer>{actions}</footer>}</section></div>
}

function App() {
  const query = new URLSearchParams(window.location.search)
  const [view, setView] = useState(query.get('view') || 'intro')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [files, setFiles] = useState(initialFiles)
  const [studyStage, setStudyStage] = useState(() => {
    const match = window.location.hash.match(/^#stage-(\d)$/)
    return match ? Math.min(Number(match[1]), 4) : 0
  })
  const [sessionComplete, setSessionComplete] = useState(false)
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [sourceModal, setSourceModal] = useState(null)
  const [reportModal, setReportModal] = useState(false)
  const [paywallAction, setPaywallAction] = useState(null)
  const [reportSent, setReportSent] = useState(false)
  const progress = sessionComplete ? 72 : 68

  useEffect(() => {
    const onPopState = () => setView(new URLSearchParams(window.location.search).get('view') || 'intro')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    const heading = document.querySelector('h1')
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }) }
  }, [view, studyStage])

  function go(nextView, hash = '') {
    setView(nextView)
    setMobileOpen(false)
    const url = nextView === 'intro' ? window.location.pathname : `${window.location.pathname}?view=${nextView}${hash}`
    window.history.pushState(null, '', url)
  }

  function requestPaywall(action) { setPaywallAction(() => action) }

  const page = view === 'dashboard' ? <Dashboard go={go} sessionComplete={sessionComplete} progress={progress} paywall={requestPaywall} />
    : view === 'course' ? <CoursePage files={files} setFiles={setFiles} />
      : view === 'study' ? <StudyPage go={go} stage={studyStage} setStage={setStudyStage} preferences={preferences} onSource={setSourceModal} onReport={() => { setReportSent(false); setReportModal(true) }} markComplete={() => setSessionComplete(true)} />
        : view === 'tutor' ? <TutorPage onSource={setSourceModal} onReport={() => { setReportSent(false); setReportModal(true) }} go={go} />
          : view === 'progress' ? <ProgressPage progress={progress} sessionComplete={sessionComplete} go={go} />
            : <SettingsPage preferences={preferences} setPreferences={setPreferences} />

  return <>
    <div className="app-root-content" inert={sourceModal || reportModal ? true : undefined}>
      {view === 'intro' ? <Intro go={go} /> : <AppShell view={view} go={go} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} progress={progress}>{page}</AppShell>}
    </div>
    {paywallAction && <Paywall onClose={() => setPaywallAction(null)} onContinue={() => { const action = paywallAction; setPaywallAction(null); action?.() }} />}
    {sourceModal && <Modal title="Course source preview" onClose={() => setSourceModal(null)} actions={<Button onClick={() => setSourceModal(null)}>Done</Button>}><div className="source-preview"><span className="file-icon large"><Icon name="file" size={23} /></span><div><strong>{sourceModal.file}</strong><p>{sourceModal.location}</p><small>Mock preview · The original course document is not opened in this front-end prototype.</small></div></div></Modal>}
    {reportModal && <Modal title={reportSent ? 'Report received' : 'Report incorrect answer'} onClose={() => setReportModal(false)} actions={reportSent ? <Button onClick={() => setReportModal(false)}>Done</Button> : <><Button variant="secondary" onClick={() => setReportModal(false)}>Cancel</Button><Button onClick={() => setReportSent(true)}>Send Report</Button></>}><div className="report-form">{reportSent ? <p>Thank you. In a real product, this would help review the answer and its supporting course sources.</p> : <><p>What seemed incorrect or unclear?</p><label><input type="radio" name="issue" defaultChecked />The explanation does not match the source</label><label><input type="radio" name="issue" />The source reference is wrong</label><label><input type="radio" name="issue" />The explanation is unclear</label></>}</div></Modal>}
  </>
}

export default App
