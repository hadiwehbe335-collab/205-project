export const courses = [
  { id: 'database', name: 'Database Systems', code: 'CSCI235', semester: 'Semester 2', progress: 68, documents: 12, topics: 8, color: 'teal' },
  { id: 'systems', name: 'Computer Systems', code: 'CSCI246', semester: 'Semester 2', progress: 42, documents: 9, topics: 11, color: 'blue' },
  { id: 'cyber', name: 'AI for Cybersecurity', code: 'CSCI369', semester: 'Semester 2', progress: 31, documents: 7, topics: 9, color: 'ochre' },
  { id: 'programming', name: 'Programming Fundamentals', code: 'CSCI151', semester: 'Semester 1', progress: 86, documents: 15, topics: 12, color: 'violet' },
]

export const materials = [
  { name: 'Lecture 01 - Introduction to Databases.pdf', type: 'Lecture', size: '3.2 MB', status: 'Ready' },
  { name: 'Lecture 04 - Normalization.pdf', type: 'Lecture', size: '5.8 MB', status: 'Ready' },
  { name: 'Tutorial 04 - Normalization.docx', type: 'Tutorial', size: '1.1 MB', status: 'Indexed' },
  { name: 'Lab 05 - SQL.pdf', type: 'Lab', size: '2.4 MB', status: 'Ready' },
  { name: 'Past Paper 2025.pdf', type: 'Past paper', size: '4.6 MB', status: 'Ready' },
]

export const priorities = [
  { topic: 'Second Normal Form', level: 'High priority', confidence: 92, evidence: '8 mentions across 4 sources' },
  { topic: 'Functional Dependencies', level: 'High priority', confidence: 87, evidence: '12 mentions across 5 sources' },
  { topic: 'SQL JOINs', level: 'High priority', confidence: 81, evidence: '9 mentions across 3 sources' },
  { topic: 'ER Diagrams', level: 'Medium priority', confidence: 64, evidence: '6 mentions across 3 sources' },
  { topic: 'Transactions', level: 'Medium priority', confidence: 58, evidence: '5 mentions across 2 sources' },
]

export const topics = [
  { name: 'Functional Dependencies', mastery: 72, state: 'Review' },
  { name: 'First Normal Form', mastery: 91, state: 'Strong' },
  { name: 'Second Normal Form', mastery: 68, state: 'In progress' },
  { name: 'Third Normal Form', mastery: 61, state: 'In progress' },
  { name: 'ER Diagrams', mastery: 91, state: 'Strong' },
  { name: 'SQL JOINs', mastery: 76, state: 'Review' },
  { name: 'PL/SQL', mastery: 54, state: 'Needs practice' },
  { name: 'Transactions', mastery: 66, state: 'In progress' },
]

export const quizQuestions = [
  {
    question: 'What is a partial dependency?',
    options: [
      'A non-key attribute depends on part of a composite key',
      'A primary key depends on a non-key attribute',
      'Two tables share the same foreign key',
      'Every attribute depends on the full primary key',
    ],
    correct: 0,
    explanation: 'A partial dependency exists when a non-key attribute depends on only part of a composite primary key.',
    source: 'Lecture 04 — Slide 15',
  },
  {
    question: 'Which condition must be true before a relation can be in 2NF?',
    options: ['It must be in 1NF', 'It must have one column', 'It must use a surrogate key', 'It must contain no foreign keys'],
    correct: 0,
    explanation: 'Second Normal Form builds on First Normal Form, so all values must already be atomic.',
    source: 'Lecture 04 — Slide 17',
  },
  {
    question: 'When can a partial dependency occur?',
    options: ['With a composite key', 'Only with a single-column key', 'Only in 3NF', 'Whenever a foreign key exists'],
    correct: 0,
    explanation: 'A dependency can only be partial when the candidate key contains more than one attribute.',
    source: 'Tutorial 04 — Question 3',
  },
  {
    question: 'What is the usual fix for a partial dependency?',
    options: ['Decompose the relation', 'Delete the primary key', 'Duplicate the attribute', 'Merge all related tables'],
    correct: 0,
    explanation: 'Move attributes that depend on part of the key into a new relation with that determinant as its key.',
    source: 'Lecture 04 — Slide 19',
  },
  {
    question: 'Which relation is in 2NF?',
    options: [
      'A 1NF relation with no partial dependencies',
      'Any relation with a primary key',
      'A relation with repeating groups',
      'A relation with no candidate key',
    ],
    correct: 0,
    explanation: 'A relation is in 2NF when it is in 1NF and every non-key attribute depends on the whole candidate key.',
    source: 'Lecture 04 — Slide 17',
  },
]

export const flashcards = [
  { front: 'What is Second Normal Form?', back: 'A table is in 2NF if it is in 1NF and contains no partial dependencies.', source: 'Lecture 04 — Slide 17' },
  { front: 'What is a composite key?', back: 'A key formed from two or more attributes that together uniquely identify a row.', source: 'Lecture 04 — Slide 13' },
  { front: 'What is a partial dependency?', back: 'When a non-key attribute depends on only part of a composite candidate key.', source: 'Tutorial 04 — Question 3' },
]

export const videos = [
  { id: '2nf', title: 'Understanding Second Normal Form', duration: '6 min', topic: 'Normalization', watched: 68 },
  { id: 'fd', title: 'Functional Dependencies Explained', duration: '5 min', topic: 'Dependencies', watched: 0 },
  { id: 'joins', title: 'SQL JOINs Visual Guide', duration: '8 min', topic: 'SQL', watched: 24 },
]

