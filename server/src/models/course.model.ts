import mongoose, { Document, Schema } from 'mongoose'

// Course interface
export interface ICourse extends Document {
  name: string
  code: string
  description?: string
  teacher: mongoose.Types.ObjectId
  students: mongoose.Types.ObjectId[]
  startDate: Date
  endDate?: Date
  schedule: {
    day: string
    startTime: string
    endTime: string
  }[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Course schema
const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: [true, 'Day is required'],
        },
        startTime: {
          type: String,
          required: [true, 'Start time is required'],
        },
        endTime: {
          type: String,
          required: [true, 'End time is required'],
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Create and export Course model
const Course = mongoose.model<ICourse>('Course', courseSchema)
export default Course