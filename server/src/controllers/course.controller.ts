import { Request, Response, NextFunction } from 'express'
import Course from '../models/course.model'
import User from '../models/user.model'
import { ApiError } from '../middleware/errorHandler'

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query = {}

    // If user is a teacher, only show their courses
    if (req.user.role === 'teacher') {
      query = { teacher: req.user._id }
    }
    // If user is a student, only show courses they're enrolled in
    else if (req.user.role === 'student') {
      query = { students: req.user._id }
    }
    // Admin can see all courses

    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .populate('students', 'name email')

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')

    if (!course) {
      return next(ApiError.notFound(`Course not found with id of ${req.params.id}`))
    }

    // Check if user has access to this course
    if (
      req.user.role !== 'admin' &&
      req.user.role === 'teacher' &&
      course.teacher._id.toString() !== req.user._id.toString()
    ) {
      return next(ApiError.forbidden('Not authorized to access this course'))
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'teacher' &&
      !course.students.some((student: any) => student._id.toString() === req.user._id.toString())
    ) {
      return next(ApiError.forbidden('Not authorized to access this course'))
    }

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin/Teacher
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, description, teacher, students, startDate, endDate, schedule, isActive } = req.body

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code })
    if (existingCourse) {
      return next(ApiError.badRequest(`Course with code ${code} already exists`))
    }

    // Verify teacher exists and is a teacher
    const teacherUser = await User.findById(teacher || req.user._id)
    if (!teacherUser) {
      return next(ApiError.badRequest('Teacher not found'))
    }

    if (teacherUser.role !== 'teacher' && teacherUser.role !== 'admin') {
      return next(ApiError.badRequest('Assigned user must be a teacher or admin'))
    }

    // Verify students exist and are students
    if (students && students.length > 0) {
      const studentUsers = await User.find({ _id: { $in: students } })
      if (studentUsers.length !== students.length) {
        return next(ApiError.badRequest('One or more students not found'))
      }

      // Check if all users are students
      const nonStudents = studentUsers.filter(user => user.role !== 'student')
      if (nonStudents.length > 0) {
        return next(ApiError.badRequest('One or more users are not students'))
      }
    }

    // Create course
    const course = await Course.create({
      name,
      code,
      description,
      teacher: teacher || req.user._id, // Default to current user if teacher not provided
      students: students || [],
      startDate,
      endDate,
      schedule,
      isActive: isActive !== undefined ? isActive : true,
    })

    res.status(201).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin/Teacher
export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Find course
    let course = await Course.findById(req.params.id)

    if (!course) {
      return next(ApiError.notFound(`Course not found with id of ${req.params.id}`))
    }

    // Check if user is authorized to update this course
    if (
      req.user.role !== 'admin' &&
      course.teacher.toString() !== req.user._id.toString()
    ) {
      return next(ApiError.forbidden('Not authorized to update this course'))
    }

    const { code, teacher, students } = req.body

    // Check if course code already exists (if changing code)
    if (code && code !== course.code) {
      const existingCourse = await Course.findOne({ code })
      if (existingCourse) {
        return next(ApiError.badRequest(`Course with code ${code} already exists`))
      }
    }

    // Verify teacher exists and is a teacher (if changing teacher)
    if (teacher && teacher !== course.teacher.toString()) {
      const teacherUser = await User.findById(teacher)
      if (!teacherUser) {
        return next(ApiError.badRequest('Teacher not found'))
      }

      if (teacherUser.role !== 'teacher' && teacherUser.role !== 'admin') {
        return next(ApiError.badRequest('Assigned user must be a teacher or admin'))
      }
    }

    // Verify students exist and are students (if changing students)
    if (students && students.length > 0) {
      const studentUsers = await User.find({ _id: { $in: students } })
      if (studentUsers.length !== students.length) {
        return next(ApiError.badRequest('One or more students not found'))
      }

      // Check if all users are students
      const nonStudents = studentUsers.filter(user => user.role !== 'student')
      if (nonStudents.length > 0) {
        return next(ApiError.badRequest('One or more users are not students'))
      }
    }

    // Update course
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin/Teacher
export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return next(ApiError.notFound(`Course not found with id of ${req.params.id}`))
    }

    // Check if user is authorized to delete this course
    if (
      req.user.role !== 'admin' &&
      course.teacher.toString() !== req.user._id.toString()
    ) {
      return next(ApiError.forbidden('Not authorized to delete this course'))
    }

    await course.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Add students to course
// @route   POST /api/courses/:id/students
// @access  Private/Admin/Teacher
export const addStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { students } = req.body

    if (!students || !Array.isArray(students) || students.length === 0) {
      return next(ApiError.badRequest('Please provide an array of student IDs'))
    }

    // Find course
    const course = await Course.findById(req.params.id)

    if (!course) {
      return next(ApiError.notFound(`Course not found with id of ${req.params.id}`))
    }

    // Check if user is authorized to update this course
    if (
      req.user.role !== 'admin' &&
      course.teacher.toString() !== req.user._id.toString()
    ) {
      return next(ApiError.forbidden('Not authorized to update this course'))
    }

    // Verify students exist and are students
    const studentUsers = await User.find({
      _id: { $in: students },
      role: 'student',
    })

    if (studentUsers.length !== students.length) {
      return next(ApiError.badRequest('One or more students not found or are not students'))
    }

    // Add students to course (avoiding duplicates)
    const currentStudentIds = course.students.map(id => id.toString())
    const newStudentIds = students.filter(id => !currentStudentIds.includes(id.toString()))

    course.students = [...course.students, ...newStudentIds]
    await course.save()

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Remove students from course
// @route   DELETE /api/courses/:id/students
// @access  Private/Admin/Teacher
export const removeStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { students } = req.body

    if (!students || !Array.isArray(students) || students.length === 0) {
      return next(ApiError.badRequest('Please provide an array of student IDs'))
    }

    // Find course
    const course = await Course.findById(req.params.id)

    if (!course) {
      return next(ApiError.notFound(`Course not found with id of ${req.params.id}`))
    }

    // Check if user is authorized to update this course
    if (
      req.user.role !== 'admin' &&
      course.teacher.toString() !== req.user._id.toString()
    ) {
      return next(ApiError.forbidden('Not authorized to update this course'))
    }

    // Remove students from course
    course.students = course.students.filter(
      (id: any) => !students.includes(id.toString())
    )

    await course.save()

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    next(error)
  }
}