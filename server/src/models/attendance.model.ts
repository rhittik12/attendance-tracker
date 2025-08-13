import mongoose, { Document, Schema } from 'mongoose'

// Attendance status types
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

// Attendance interface
export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  date: Date
  status: AttendanceStatus
  notes?: string
  markedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// Attendance schema
const attendanceSchema = new Schema<IAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: [true, 'Status is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marker is required'],
    },
  },
  {
    timestamps: true,
  }
)

// Create a compound index to prevent duplicate attendance records
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true })

// Create and export Attendance model
const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema)
export default Attendance