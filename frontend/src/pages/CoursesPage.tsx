import { useState, useEffect } from 'react';
import { MapPin, Plus, Search } from 'lucide-react';
import { courseService } from '@/services/courseService';
import { GolfCourse } from '@/types';
import toast from 'react-hot-toast';

/**
 * CoursesPage - Browse and search all golf courses
 */
export function CoursesPage() {
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<GolfCourse[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = courses.filter(
        (course) =>
          course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchQuery, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourses();
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      toast.error('Kunne ikke laste inn golfbaner');
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeeColorBadge = (color: string) => {
    const colors: Record<string, string> = {
      white: 'bg-gray-100 text-gray-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
    };
    return colors[color] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Golf Courses</h1>
        <button
          onClick={() => (window.location.href = '/new-round')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Round
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search courses by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm">Total Courses</p>
          <p className="text-2xl font-bold text-primary-600">{courses.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Search Results</p>
          <p className="text-2xl font-bold text-primary-600">{filteredCourses.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Unique Locations</p>
          <p className="text-2xl font-bold text-primary-600">
            {new Set(courses.map((c) => c.location)).size}
          </p>
        </div>
      </div>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">
            {searchQuery ? 'No courses found matching your search.' : 'No courses available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{course.name}</h3>
                  <div className="flex items-center gap-1 text-gray-600 mt-1">
                    <MapPin size={16} />
                    <span className="text-sm">{course.location}</span>
                  </div>
                </div>
              </div>

              {/* Holes */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {course.holes.length} holes • Par {course.holes.reduce((sum, h) => sum + h.par, 0)}
                </p>
              </div>

              {/* Tee Colors */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Tees</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(course.rating).map((teeColor) => (
                    <div
                      key={teeColor}
                      className={`px-3 py-2 rounded-lg ${getTeeColorBadge(teeColor)}`}
                    >
                      <div className="text-xs font-semibold capitalize">{teeColor}</div>
                      <div className="text-xs mt-1">
                        Rating: {course.rating[teeColor as keyof typeof course.rating]} • Slope:{' '}
                        {course.slope[teeColor as keyof typeof course.slope]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => (window.location.href = `/new-round?course=${course.id}`)}
                className="w-full mt-4 btn-secondary text-sm"
              >
                Play This Course
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
