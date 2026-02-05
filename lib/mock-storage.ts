// Simple in-memory storage for mock data during development
// This will persist data during the session until the server restarts

type Department = {
  id: string
  name: string
  code: string
  description: string
  created_at: string
  updated_at: string
}

type Course = {
  id: string
  name: string
  code: string
  description: string
  credits: number
  semester: string
  year: number
  department_id: string
  instructor_id: string
  department: {
    id: string
    name: string
    code: string
  }
  instructor: {
    id: string
    full_name: string
    email: string
  }
  enrollments: any[]
  assignments: any[]
}

type Assignment = {
  id: string
  course_id: string
  title: string
  description: string
  due_date: string
  max_points: number
  allow_late: boolean
  late_penalty: number
  file_types: string[]
  max_file_size: number
  instructor_id: string
  created_at: string
  updated_at: string
  course?: {
    id: string
    name: string
    code: string
  }
}

// In-memory storage for departments
let mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Computer Science',
    code: 'CS',
    description: 'Department of Computer Science and Engineering',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Mathematics',
    code: 'MATH',
    description: 'Department of Mathematics',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Physics',
    code: 'PHYS',
    description: 'Department of Physics',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Business Administration',
    code: 'BUS',
    description: 'School of Business Administration',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// In-memory storage for courses
let mockCourses: Course[] = [
  {
    id: '1',
    name: 'Introduction to Computer Science',
    code: 'CS101',
    description: 'Basic concepts of programming and computer science',
    credits: 3,
    semester: 'Fall',
    year: 2024,
    department_id: '1',
    instructor_id: 'default',
    department: {
      id: '1',
      name: 'Computer Science',
      code: 'CS'
    },
    instructor: {
      id: 'default',
      full_name: 'Dr. John Smith',
      email: 'john.smith@university.edu'
    },
    enrollments: [],
    assignments: []
  },
  {
    id: '2',
    name: 'Data Structures and Algorithms',
    code: 'CS201',
    description: 'Advanced programming concepts and algorithm design',
    credits: 4,
    semester: 'Spring',
    year: 2024,
    department_id: '1',
    instructor_id: 'default',
    department: {
      id: '1',
      name: 'Computer Science',
      code: 'CS'
    },
    instructor: {
      id: 'default',
      full_name: 'Dr. Jane Doe',
      email: 'jane.doe@university.edu'
    },
    enrollments: [],
    assignments: []
  }
]

// In-memory storage for assignments
let mockAssignments: Assignment[] = []

// Department functions
export function getAllDepartments(): Department[] {
  return mockDepartments
}

export function addDepartment(departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Department {
  const newDepartment: Department = {
    ...departmentData,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  mockDepartments.push(newDepartment)
  return newDepartment
}

export function getDepartmentById(id: string): Department | undefined {
  return mockDepartments.find(dept => dept.id === id)
}

export function updateDepartment(id: string, updates: Partial<Department>): Department | null {
  const index = mockDepartments.findIndex(dept => dept.id === id)
  if (index === -1) return null
  
  mockDepartments[index] = { 
    ...mockDepartments[index], 
    ...updates, 
    updated_at: new Date().toISOString() 
  }
  return mockDepartments[index]
}

export function deleteDepartment(id: string): boolean {
  const index = mockDepartments.findIndex(dept => dept.id === id)
  if (index === -1) return false
  
  mockDepartments.splice(index, 1)
  return true
}

// Course functions
export function getAllCourses(): Course[] {
  return mockCourses.map(course => ({
    ...course,
    department: getDepartmentById(course.department_id) || course.department
  }))
}

export function addCourse(courseData: Omit<Course, 'id' | 'department' | 'instructor' | 'enrollments' | 'assignments'>): Course {
  const department = getDepartmentById(courseData.department_id)
  
  const newCourse: Course = {
    ...courseData,
    id: Date.now().toString(),
    department: department ? {
      id: department.id,
      name: department.name,
      code: department.code
    } : {
      id: '1',
      name: 'Computer Science',
      code: 'CS'
    },
    instructor: {
      id: courseData.instructor_id,
      full_name: 'Instructor',
      email: 'instructor@university.edu'
    },
    enrollments: [],
    assignments: []
  }
  
  mockCourses.push(newCourse)
  return newCourse
}

export function getCourseById(id: string): Course | undefined {
  const course = mockCourses.find(course => course.id === id)
  if (!course) return undefined
  
  return {
    ...course,
    department: getDepartmentById(course.department_id) || course.department
  }
}

export function updateCourse(id: string, updates: Partial<Course>): Course | null {
  const index = mockCourses.findIndex(course => course.id === id)
  if (index === -1) return null
  
  mockCourses[index] = { ...mockCourses[index], ...updates }
  return mockCourses[index]
}

export function deleteCourse(id: string): boolean {
  const index = mockCourses.findIndex(course => course.id === id)
  if (index === -1) return false
  
  mockCourses.splice(index, 1)
  return true
}

// Assignment functions
export function getAllAssignments(): Assignment[] {
  return mockAssignments.map(assignment => ({
    ...assignment,
    course: getCourseById(assignment.course_id) ? {
      id: getCourseById(assignment.course_id)!.id,
      name: getCourseById(assignment.course_id)!.name,
      code: getCourseById(assignment.course_id)!.code
    } : undefined
  }))
}

export function getAssignmentsByInstructor(instructorId: string): Assignment[] {
  return mockAssignments.filter(assignment => assignment.instructor_id === instructorId)
    .map(assignment => ({
      ...assignment,
      course: getCourseById(assignment.course_id) ? {
        id: getCourseById(assignment.course_id)!.id,
        name: getCourseById(assignment.course_id)!.name,
        code: getCourseById(assignment.course_id)!.code
      } : undefined
    }))
}

export function getAssignmentsByCourse(courseId: string): Assignment[] {
  return mockAssignments.filter(assignment => assignment.course_id === courseId)
    .map(assignment => ({
      ...assignment,
      course: getCourseById(assignment.course_id) ? {
        id: getCourseById(assignment.course_id)!.id,
        name: getCourseById(assignment.course_id)!.name,
        code: getCourseById(assignment.course_id)!.code
      } : undefined
    }))
}

export function addAssignment(assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'course'>): Assignment {
  // Validate that the course exists
  const course = getCourseById(assignmentData.course_id)
  if (!course) {
    throw new Error('Invalid course ID')
  }

  const newAssignment: Assignment = {
    ...assignmentData,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    course: {
      id: course.id,
      name: course.name,
      code: course.code
    }
  }
  
  mockAssignments.push(newAssignment)
  return newAssignment
}

export function getAssignmentById(id: string): Assignment | undefined {
  const assignment = mockAssignments.find(assignment => assignment.id === id)
  if (!assignment) return undefined
  
  const course = getCourseById(assignment.course_id)
  return {
    ...assignment,
    course: course ? {
      id: course.id,
      name: course.name,
      code: course.code
    } : undefined
  }
}

export function updateAssignment(id: string, updates: Partial<Assignment>): Assignment | null {
  const index = mockAssignments.findIndex(assignment => assignment.id === id)
  if (index === -1) return null
  
  mockAssignments[index] = { 
    ...mockAssignments[index], 
    ...updates, 
    updated_at: new Date().toISOString() 
  }
  return mockAssignments[index]
}

export function deleteAssignment(id: string): boolean {
  const index = mockAssignments.findIndex(assignment => assignment.id === id)
  if (index === -1) return false
  
  mockAssignments.splice(index, 1)
  return true
}