import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import AddPtModal from "./AddPtModal";

export default function ViewPtLists() {
  const navigate = useNavigate();
  const { batchId, semesterId } = useParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pts, setPts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const dropdownRef = useRef(null);

  const fetchPts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API}/pt/${batchId}/${semesterId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch PT lists");
      }

      const data = await response.json();
      setPts(data);
    } catch (error) {
      console.error("Failed to fetch PT lists:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (ptId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API}/pt`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          batchId,
          semId:semesterId,
          ptId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete PT list");
      }

      setPts((prevPts) => prevPts.filter((pt) => pt.ptId !== ptId));
      setDropdownIndex(null);
    } catch (error) {
      console.error("Error deleting PT list:", error);
      setError("Failed to delete PT list.");
    }
  };

  useEffect(() => {
    fetchPts();
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
          className="bg-green-600 text-xl p-2 w-fit text-white border-none rounded-md mt-4"
          onClick={() => setIsModalOpen(true)}
        >
          Add PtList
        </button>
      </div>

      <AddPtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchPts={fetchPts}
      />

      <div className="grid grid-cols-4 gap-4 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center mt-4 text-2xl">
            Loading...
          </div>
        ) : error ? (
          <div className="flex justify-center items-center mt-4 text-red-500 text-2xl">
            {error}
          </div>
        ) : pts.length === 0 ? (
          <div className="flex justify-center items-center mt-4 text-2xl">
            No PT lists available.
          </div>
        ) : (
          pts.map((pt, index) => (
            <div
              key={pt.ptId}
              className="relative p-4 bg-gray-200 rounded-md shadow-sm hover:shadow-md flex justify-between items-center"
            >
              <div
                className="cursor-pointer flex-grow"
                onClick={() =>
                  navigate(`/ptlists/${batchId}/${semesterId}/${pt.ptId}`)
                }
              >
                {pt.title}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
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
                        handleDelete(pt.ptId);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
