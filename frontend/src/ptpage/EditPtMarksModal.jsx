import React, { useState } from "react";
import { useParams } from "react-router-dom";
import close from "../../assets/close.svg";

export default function Editptmark({ student, onClose, fetchStudent }) {
  const { ptId, batchId, semesterId } = useParams();
  const [formData, setFormData] = useState({
    name: student.name,
    rollno: student.rollno,
    parts: student.parts,
  });

  const handleChange = (e, partIndex, questionIndex) => {
    const { value } = e.target;
    setFormData((prevState) => {
      const updatedParts = [...prevState.parts];
      updatedParts[partIndex].questions[questionIndex].mark = Number(value);

      return { ...prevState, parts: updatedParts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API}/pt`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          semId: semesterId,
          batchId,
          ptId,
          scores: formData.parts,
          stdId: formData.rollno,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update marks");
      }
      const data = await response.json();
      fetchStudent();
      onClose();
    } catch (error) {
      console.error("Error updating marks:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="relative bg-white p-6 rounded shadow-lg w-full max-w-3xl h-3/4 overflow-y-auto">
        <img
          src={close}
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-700 hover:text-gray-900 cursor-pointer"
        />
        <h2 className="text-xl font-bold mb-4">Edit Student Marks</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Roll No</label>
            <input
              type="text"
              value={formData.rollno}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          {formData.parts.map((part, partIndex) => (
            <div key={partIndex} className="mb-4">
              <h3 className="text-lg font-bold mb-2">{part.title}</h3>
              {part.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="mb-2">
                  <label className="block text-gray-700">
                    Question {question.number} ({question.option})
                  </label>
                  <input
                    type="number"
                    name={`part-${partIndex}-question-${questionIndex}`}
                    value={question.mark}
                    onChange={(e) => handleChange(e, partIndex, questionIndex)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              ))}
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
