const students = [];

function registerStudent(details = {}) {

  const record = {
    id: details.id,
    name: details.name || 'Unknown student',
    email: details.email || null,
    connectionId: details.connectionId || null,
    connectedAt: details.connectedAt || new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    metadata: details.metadata || {}
  };

  const index = students.findIndex((student) => {
    if (record.id) {
      return student.id === record.id;
    }
    return student.id === record.id;
  });

  if (index >= 0) {
    students[index] = { ...students[index], ...record, lastSeen: new Date().toISOString() };
    return students[index];
  }

  students.push(record);
  return record;
}

function getStudents() {
  return [...students];
}

function getStudentByStudentId(studentId) {
  const student = students.find((student) => student.id === studentId);
  if (student) {
    student.lastSeen = new Date().toISOString();
  }
  return student;
}

function removeStudentByStudentId(studentId) {
  const index = students.findIndex((student) => student.id === studentId);

  if (index === -1) return null;
  const [removed] = students.splice(index, 1);
  return removed;
}

module.exports = {
  students,
  registerStudent,
  getStudents,
  getStudentByStudentId,
  removeStudentByStudentId
};
