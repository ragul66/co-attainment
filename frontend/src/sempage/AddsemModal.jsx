import React, { useState } from "react";
import close from "../../assets/close.svg";
import { useParams } from "react-router-dom";

function AddSemModal({ isOpen, onClose, handleAddSem }) {
  const { batchId } = useParams();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const postSem = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API}/semester`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          title,
          batchId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create semester.");
      }

      const result = await response.json();
      handleAddSem(result);
      setTitle("");
      setSuccess("Semester created successfully!");

      setTimeout(() => {
        setSuccess("");
        onClose();
      });
    } catch (error) {
      console.error("Error posting the semester:", error);
      setError("Failed to create semester. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-md relative w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          className="absolute top-2 right-2 p-2 rounded cursor-pointer"
          onClick={onClose}
          src={close}
          alt="Close"
        />
        <h2 className="text-2xl mb-4">Add Semester</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <form onSubmit={postSem}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="sem"
            >
              Semester Name
            </label>
            <input
              id="sem"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter semester name"
              required
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`bg-blue-500 text-white p-2 rounded mr-2 ${
                (!title || submitting) && "opacity-50 cursor-not-allowed"
              }`}
              disabled={!title || submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSemModal;
