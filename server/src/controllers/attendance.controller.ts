import { Request, Response, NextFunction } from 'express'
import Attendance from '../models/attendance.model'
import Course from '../models/course.model'
import User from '../models/user.model'
import { ApiError } from '../middleware/errorHandler'
import { io } from '../index'

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendanceRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query: any = {}

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      }
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate as string) }
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate as string) }
    }

    // Filter by course
    if (req.query.course) {
      query.course = req.query.course
    }

    // Filter by student
    if (req.query.student) {
      query.student = req.query.student
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status
    }

    // If user is a teacher, only show attendance for their courses
    if (req.user.role === 'teacher') {
      const teacherCourses = await Course.find({ teacher: req.user._id }).select('_id')
      const courseIds = teacherCourses.map(course => course._id)
      query.course = { $in: courseIds }
    }

    // If user is a student, only show their own attendance
    if (req.user.role === 'student') {
      query.student = req.user._id
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name email')
      .populate('course', 'name code')
      .populate('markedBy', 'name role')
      .sort({ date: -1 })

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
export const getAttendanceRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'name code')
      .populate('markedBy', 'name role')

    if (!attendance) {
      return next(ApiError.notFound(`Attendance record not found with id of ${req.params.id}`))
    }

    // Check if user has access to this attendance record
    if (req.user.role === 'student' && attendance.student._id.toString() !== req.user._id.toString()) {
      return next(ApiError.forbidden('Not authorized to access this attendance record'))
    }

    if (req.user.role === 'teacher') {
      const course = await Course.findById(attendance.course)
      if (!course || course.teacher.toString() !== req.user._id.toString()) {
        return next(ApiError.forbidden('Not authorized to access this attendance record'))
      }
    }

    res.status(200).json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Private/Admin/Teacher
export const createAttendanceRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { student, course, date, status, notes } = req.body

    // Validate required fields
    if (!student || !course || !status) {
      return next(ApiError.badRequest('Please provide student, course, and status'))
    }

    // Check if student exists
    const studentUser = await User.findById(student)
    if (!studentUser) {
      return next(ApiError.badRequest('Student not found'))
    }

    if (studentUser.role !== 'student') {
      return next(ApiError.badRequest('User is not a student'))
    }

    // Check if course exists
    const courseDoc = await Course.findById(course)
    if (!courseDoc) {
      return next(ApiError.badRequest('Course not found'))
    }

  // Check if student is enrolled in the course
  const enrolled = courseDoc.students.some((s: any) => s.toString() === (student as any).toString())
  if (!enrolled) {
      return next(ApiError.badRequest('Student is not enrolled in this course'))
    }

    // Check if user is authorized to create attendance for this course
    if (
      req.user.role !== 'admin' &&
      courseDoc.teacher.toString() !== req.user._id.toString()
    ) {
      return next(ApiError.forbidden('Not authorized to create attendance for this course'))
    }

    // Check if attendance record already exists for this student, course, and date
    const attendanceDate = date ? new Date(date) : new Date()
    const existingAttendance = await Attendance.findOne({
      student,
      course,
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999)),
      },
    })

    if (existingAttendance) {
      return next(
        ApiError.badRequest('Attendance record already exists for this student, course, and date')
      )
    }

    // Create attendance record
    const attendance = await Attendance.create({
      student,
      course,
      date: date || new Date(),
      status,
      notes,
      markedBy: req.user._id,
    })

    // Populate the attendance record for the response
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student', 'name email')
      .populate('course', 'name code')
      .populate('markedBy', 'name role')

    // Emit socket event
    io.to('admin')
      .to('teacher')
      .to(student)
      .emit('attendance:update', populatedAttendance)

    res.status(201).json({
      success: true,
      data: populatedAttendance,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Admin/Teacher
export const updateAttendanceRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body

    // Find attendance record
    let attendance = await Attendance.findById(req.params.id)

    if (!attendance) {
      return next(ApiError.notFound(`Attendance record not found with id of ${req.params.id}`))
    }

    // Check if user is authorized to update this attendance record
    if (req.user.role !== 'admin') {
      const course = await Course.findById(attendance.course)
      if (!course || course.teacher.toString() !== req.user._id.toString()) {
        return next(ApiError.forbidden('Not authorized to update this attendance record'))
      }
    }

    // Update attendance record
    attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, notes, markedBy: req.user._id },
      { new: true, runValidators: true }
    )
      .populate('student', 'name email')
      .populate('course', 'name code')
      .populate('markedBy', 'name role')

    if (!attendance) {
      return next(ApiError.notFound(`Attendance record not found with id of ${req.params.id}`))
    }

    // Emit socket event
    io.to('admin')
      .to('teacher')
      .to(attendance.student._id.toString())
      .emit('attendance:update', attendance)

    res.status(200).json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin/Teacher
export const deleteAttendanceRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attendance = await Attendance.findById(req.params.id)

    if (!attendance) {
      return next(ApiError.notFound(`Attendance record not found with id of ${req.params.id}`))
    }

    // Check if user is authorized to delete this attendance record
    if (req.user.role !== 'admin') {
      const course = await Course.findById(attendance.course)
      if (!course || course.teacher.toString() !== req.user._id.toString()) {
        return next(ApiError.forbidden('Not authorized to delete this attendance record'))
      }
    }

    await attendance.deleteOne()

    // Emit socket event
    io.to('admin')
      .to('teacher')
      .to(attendance.student.toString())
      .emit('attendance:delete', { id: req.params.id })

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
export const getAttendanceStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let matchStage: any = {}

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      matchStage.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      }
    } else if (req.query.startDate) {
      matchStage.date = { $gte: new Date(req.query.startDate as string) }
    } else if (req.query.endDate) {
      matchStage.date = { $lte: new Date(req.query.endDate as string) }
    }

    // Filter by course
    if (req.query.course) {
      matchStage.course = req.query.course
    }

    // Filter by student
    if (req.query.student) {
      matchStage.student = req.query.student
    }

    // If user is a teacher, only show attendance for their courses
    if (req.user.role === 'teacher') {
      const teacherCourses = await Course.find({ teacher: req.user._id }).select('_id')
      const courseIds = teacherCourses.map(course => course._id)
      matchStage.course = { $in: courseIds }
    }

    // If user is a student, only show their own attendance
    if (req.user.role === 'student') {
      matchStage.student = req.user._id
    }

    // Aggregate attendance statistics
    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    // Format the results
    const formattedStats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    }

    stats.forEach((stat: any) => {
      formattedStats[stat._id as keyof typeof formattedStats] = stat.count
    })

    // Calculate total and attendance rate
    const total = Object.values(formattedStats).reduce((acc: number, val: number) => acc + val, 0)
    const attendanceRate = total > 0 ? ((formattedStats.present + formattedStats.late) / total) * 100 : 0

    res.status(200).json({
      success: true,
      data: {
        ...formattedStats,
        total,
        attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Student marks their own attendance for today (creates a private course if needed)
// @route   POST /api/attendance/self
// @access  Private (any authenticated user)
export const markSelfAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id
    const status = (req.body.status || 'present').toLowerCase()
    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return next(ApiError.badRequest('Invalid status'))
    }

    // Find or create a private course for the user
    const code = `SELF-${userId}`.slice(0, 32)
    let course = await Course.findOne({ code })
    if (!course) {
      course = await Course.create({
        name: 'Self Attendance',
        code,
        description: 'Auto-created self-attendance course',
        teacher: userId,
        students: [userId],
        startDate: new Date(),
        isActive: true,
        schedule: [],
      })
    } else {
      // Ensure the user is listed as a student
      if (!course.students.some((s: any) => s.toString() === userId.toString())) {
        course.students.push(userId)
        await course.save()
      }
    }

    // Upsert today's attendance
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    let attendance = await Attendance.findOne({
      student: userId,
      course: course._id,
      date: { $gte: start, $lte: end },
    })

    if (attendance) {
      attendance.status = status as any
      attendance.markedBy = userId
      if (req.body.notes) attendance.notes = req.body.notes
      await attendance.save()
    } else {
      attendance = await Attendance.create({
        student: userId,
        course: course._id,
        date: now,
        status,
        notes: req.body.notes,
        markedBy: userId,
      })
    }

    const populated = await Attendance.findById(attendance._id)
      .populate('student', 'name email')
      .populate('course', 'name code')
      .populate('markedBy', 'name role')

    io.to(userId.toString()).emit('attendance:update', populated)

    res.status(200).json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
}