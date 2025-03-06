import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import Addsemmodal from "./AddsemModal";

function ViewSems() {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sems, setSems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const dropdownRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAddSem = (newSem) => {
    setSems((prevSems) => [...prevSems, newSem]);
  };

  const fetchSems = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API}/semester/${batchId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch semesters.");
      }

      const data = await response.json();
      setSems(data);
    } catch (error) {
      console.error("Error fetching Semester:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (semesterId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API}/semester`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          batchId,
          semId: semesterId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete semester");
      }

      setSems((prevSems) =>
        prevSems.filter((sem) => sem.semesterId !== semesterId)
      );
      setDropdownIndex(null);
    } catch (error) {
      console.error("Error deleting semester", error);
      setError("Failed to delete semester");
    }
  };

  useEffect(() => {
    fetchSems();
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
      <div className="flex justify-between p-2 px-4 font-primary">
        <h2 className="font-bold text-2xl text-blue-600 mb-6">Semester</h2>
        <button
          className="bg-green-600 text-xl p-2 w-fit text-white border-none rounded-md mt-4"
          onClick={openModal}
        >
          Add Sem
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-500 text-lg mt-4">Loading...</div>
      )}

      {error && (
        <div className="text-center text-red-500 text-lg mt-4">{error}</div>
      )}

      {!loading && sems.length === 0 && !error && (
        <div className="text-center text-gray-500 text-lg mt-4">
          No semesters found.
        </div>
      )}

      {!loading && sems.length > 0 && (
        <div className="grid grid-cols-4 gap-4 p-4">
          {sems.map((sem, index) => (
            <div
              key={sem.semesterId}
              className="relative bg-gray-200 rounded-md shadow-sm hover:shadow-md flex justify-between items-center"
            >
              <div
                className="cursor-pointer p-4 flex-grow"
                onClick={() =>
                  navigate(`/namelist/${batchId}/${sem.semesterId}`)
                }
              >
                {sem.title}
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
                        handleDelete(sem.semesterId);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Addsemmodal
        isOpen={isModalOpen}
        onClose={closeModal}
        handleAddSem={handleAddSem}
      />
    </>
  );
}

export default ViewSems;
