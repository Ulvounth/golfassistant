import { useState, FormEvent, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { courseService, CreateCourseData } from '@/services/courseService';
import { CourseHole } from '@/types';
import { useTokenExpiry } from '@/hooks/useTokenExpiry';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseAdded: (courseId: string, courseName: string) => void;
}

const DRAFT_KEY = 'golftracker_course_draft';

/**
 * Modal for adding new golf course
 * Allows user to fill in info from scorecard
 * Saves draft in localStorage to avoid data loss
 */
export function AddCourseModal({ isOpen, onClose, onCourseAdded }: AddCourseModalProps) {
  const { minutesUntilExpiry, isExpiringSoon } = useTokenExpiry();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Basic info, 2: Holes
  const [hasDraft, setHasDraft] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ratingWhite: 72,
    ratingYellow: 70,
    ratingBlue: 68,
    ratingRed: 66,
    slopeWhite: 130,
    slopeYellow: 126,
    slopeBlue: 122,
    slopeRed: 118,
  });

  const [holes, setHoles] = useState<CourseHole[]>(
    Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      par: 4,
      length: {
        white: 350,
        yellow: 330,
        blue: 300,
        red: 270,
      },
      strokeIndex: i + 1,
    }))
  );

  // Load draft on startup
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft && isOpen) {
      try {
        JSON.parse(savedDraft); // Verify it's valid JSON
        setHasDraft(true);
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [isOpen]);

  // Save draft automatically when data changes
  useEffect(() => {
    if (isOpen && (formData.name || formData.location)) {
      const draft = {
        step,
        formData,
        holes,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [formData, holes, step, isOpen]);

  const loadDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData);
        setHoles(draft.holes);
        setStep(draft.step);
        setHasDraft(false);
        setError('');
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const handleBasicInfoSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      setError('Name and location are required');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleHoleChange = (index: number, field: keyof CourseHole, value: number) => {
    const newHoles = [...holes];
    if (field === 'par' || field === 'strokeIndex') {
      newHoles[index] = { ...newHoles[index], [field]: value };
    }
    setHoles(newHoles);
  };

  const handleHoleLengthChange = (
    index: number,
    tee: 'white' | 'yellow' | 'blue' | 'red',
    value: number
  ) => {
    const newHoles = [...holes];
    newHoles[index] = {
      ...newHoles[index],
      length: { ...newHoles[index].length, [tee]: value },
    };
    setHoles(newHoles);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const courseData: CreateCourseData = {
        name: formData.name,
        location: formData.location,
        holes: holes, // Always submit all 18 holes
        rating: {
          white: formData.ratingWhite,
          yellow: formData.ratingYellow,
          blue: formData.ratingBlue,
          red: formData.ratingRed,
        },
        slope: {
          white: formData.slopeWhite,
          yellow: formData.slopeYellow,
          blue: formData.slopeBlue,
          red: formData.slopeRed,
        },
      };

      const newCourse = await courseService.createCourse(courseData);

      // Delete draft when save was successful
      clearDraft();

      onCourseAdded(newCourse.id, newCourse.name);
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };

      // If 401 (token expired), don't show error message
      // Axios interceptor handles redirect and draft is already saved
      if (error.response?.status === 401) {
        return;
      }

      setError(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Add New Golf Course</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Draft notification */}
          {hasDraft && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">💾 Unsaved draft found</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    You have an unsaved draft from earlier. Do you want to continue where you left
                    off?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={loadDraft} className="btn-primary text-sm">
                      Yes, continue with draft
                    </button>
                    <button onClick={clearDraft} className="btn-secondary text-sm">
                      No, start over
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Token expiry warning */}
          {isExpiringSoon && minutesUntilExpiry !== null && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-orange-900 mb-1">
                  ⏰ Your session is expiring soon
                </p>
                <p className="text-orange-700">
                  You have {minutesUntilExpiry} minutes left. Data is saved automatically, so you
                  can continue after logging in.
                </p>
              </div>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{error}</div>}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Oslo Golf Club"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Oslo"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ <strong>Tip:</strong> Register all 18 holes on the course. When playing a
                  round, you can choose whether to play front 9, back 9, or all 18 holes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Course Rating</h3>
                  <div className="space-y-3">
                    {(['white', 'yellow', 'blue', 'red'] as const).map(tee => (
                      <div key={tee}>
                        <label className="block text-sm text-gray-700 mb-1 capitalize">{tee}</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input"
                          value={
                            formData[
                              `rating${
                                tee.charAt(0).toUpperCase() + tee.slice(1)
                              }` as keyof typeof formData
                            ]
                          }
                          onChange={e =>
                            setFormData({
                              ...formData,
                              [`rating${tee.charAt(0).toUpperCase() + tee.slice(1)}`]: parseFloat(
                                e.target.value
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Slope Rating</h3>
                  <div className="space-y-3">
                    {(['white', 'yellow', 'blue', 'red'] as const).map(tee => (
                      <div key={tee}>
                        <label className="block text-sm text-gray-700 mb-1 capitalize">{tee}</label>
                        <input
                          type="number"
                          className="input"
                          value={
                            formData[
                              `slope${
                                tee.charAt(0).toUpperCase() + tee.slice(1)
                              }` as keyof typeof formData
                            ]
                          }
                          onChange={e =>
                            setFormData({
                              ...formData,
                              [`slope${tee.charAt(0).toUpperCase() + tee.slice(1)}`]: parseInt(
                                e.target.value
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Next: Enter Hole Info
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Holes */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Fill in par and length for each hole from the scorecard. You can also just use the
                  default values.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Hole</th>
                      <th className="text-left py-2">Par</th>
                      <th className="text-left py-2">HCP</th>
                      <th className="text-left py-2 text-xs">White (m)</th>
                      <th className="text-left py-2 text-xs">Yellow (m)</th>
                      <th className="text-left py-2 text-xs">Blue (m)</th>
                      <th className="text-left py-2 text-xs">Red (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holes.map((hole, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-semibold">{hole.holeNumber}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            min={3}
                            max={6}
                            className="w-16 px-2 py-1 border rounded"
                            value={hole.par}
                            onChange={e => handleHoleChange(index, 'par', parseInt(e.target.value))}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            min={1}
                            max={18}
                            className="w-16 px-2 py-1 border rounded"
                            value={hole.strokeIndex}
                            onChange={e =>
                              handleHoleChange(index, 'strokeIndex', parseInt(e.target.value))
                            }
                          />
                        </td>
                        {(['white', 'yellow', 'blue', 'red'] as const).map(tee => (
                          <td key={tee} className="py-2">
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border rounded text-xs"
                              value={hole.length[tee]}
                              onChange={e =>
                                handleHoleLengthChange(index, tee, parseInt(e.target.value))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  Back
                </button>
                <div className="flex gap-4">
                  <button type="button" onClick={onClose} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : 'Save Course'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
