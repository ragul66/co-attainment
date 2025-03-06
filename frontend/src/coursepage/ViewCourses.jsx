import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import AddCourseModal from "./AddCourseModal";

const ViewCourses = () => {
  const navigate = useNavigate();
  const { batchId, semesterId } = useParams();
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const dropdownRef = useRef(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API}/course/${batchId}/${semesterId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setError("Failed to fetch courses.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API}/course`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          batchId,
          semId: semesterId,
          coId: courseId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      setCourses((prevCourses) =>
        prevCourses.filter((course) => course.courseId !== courseId)
      );
      setDropdownIndex(null);
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course.");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setDropdownIndex(null);
        }
      }
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

  return (
    <>
      <div className="flex justify-end p-2 font-primary">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-xl p-2 w-fit text-white border-none rounded-md mt-4"
        >
          Add Course
        </button>
      </div>

      <AddCourseModal
        isModalOpen={isModalOpen}
        toggleModal={() => setIsModalOpen(false)}
        fetchCourses={fetchCourses}
      />

      <div className="grid grid-cols-4 gap-4 p-4">
        {loading ? (
          <div className="flex justify-center mt-4 text-2xl">Loading...</div>
        ) : error ? (
          <div className="flex justify-center mt-4 text-red-500">{error}</div>
        ) : courses.length > 0 ? (
          courses.map((course, index) => (
            <div
              key={course.courseId}
              className="relative bg-gray-200 rounded-md shadow-sm hover:shadow-md flex justify-between items-center"
            >
              <div
                className="cursor-pointer p-4 flex-grow"
                onClick={() =>
                  navigate(
                    `/courses/${batchId}/${semesterId}/${course.courseId}`
                  )
                }
              >
                {course.title}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  className=" p-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownIndex(dropdownIndex === index ? null : index);
                  }}
                >
                  <FiMoreVertical />
                </button>

                {dropdownIndex === index && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md">
                    <button
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(course.courseId);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center mt-4">No courses available</div>
        )}
      </div>
    </>
  );
};

export default ViewCourses;
