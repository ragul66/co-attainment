import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import AddbatchModal from "./AddbatchModal";

function Dashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const dropdownRef = useRef(null);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    fetchBatch();
  };

  const handleAddItem = (newItem) => setItems((prevItems) => [...prevItems, newItem]);

  const fetchBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API}/batch`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch batch data");
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to fetch batch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (batchId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API}/batch`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ batchId }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete batch");
      }
      setItems((prevItems) => prevItems.filter((item) => item.batchId !== batchId));
      setDropdownIndex(null); // Close dropdown after deletion
    } catch (error) {
      console.error("Error deleting batch:", error);
      setError("Failed to delete batch");
    }
  };

  useEffect(() => {
    fetchBatch();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex justify-end p-2 font-primary">
        <button
          onClick={handleOpenModal}
          className="bg-green-600 text-xl p-2 w-fit text-white border-none rounded-md mt-4"
        >
          Add Batch
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 p-4">
        {loading ? (
          <p className="text-center col-span-4">Loading batches...</p>
        ) : error ? (
          <p className="text-center col-span-4 text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-center col-span-4 text-gray-500">No batches available.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.batchId}
              className="relative p-4 bg-gray-200 rounded-md shadow-sm hover:shadow-md flex justify-between items-center"
            >
              <div
                className="cursor-pointer flex-grow"
                onClick={() => navigate(`/sem/${item.batchId}`)}
              >
                {item.title}
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
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.batchId);
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

      <AddbatchModal show={showModal} onClose={handleCloseModal} onAddItem={handleAddItem} />
    </>
  );
}

export default Dashboard;
