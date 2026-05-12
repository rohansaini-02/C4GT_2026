export interface UserProfile {
  name: string;
  email: string;
  full_name: string;
  user_image?: string;
  roles: string[];
}

export interface LMSCourse {
  name: string;
  title: string;
  short_introduction?: string;
  image?: string;
  status: 'Published' | 'Under Development';
}

export interface LMSLesson {
  name: string;
  title: string;
  course: string;
  content_type: 'Video' | 'Article' | 'Quiz';
  duration?: number;
}

export interface AssignmentSubmission {
  course: string;
  lesson: string;
  student: string;
  submission_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}
