import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";

function SelectCoatt() {
  const { batchId, semesterId } = useParams();
  const [error, setError] = useState(null);
  const [coattainmentData, setCoattainmentData] = useState([]);
  const [skills, setSkills] = useState(new Set());
  const [courseNames, setCourseNames] = useState(new Set());

  useEffect(() => {
    if (coattainmentData.length > 0) {
      const skillSet = new Set();
      const assessmentSet = new Set();
      const courseSet = new Set();

      coattainmentData.forEach((student) => {
        if (student.skills) {
          Object.entries(student.skills).forEach(([skill, scores]) => {
            skillSet.add(skill);
            Object.keys(scores).forEach((type) => assessmentSet.add(type));
          });
        }
        if (student.courses) {
          Object.keys(student.courses).forEach((course) =>
            courseSet.add(course)
          );
        }
      });

      setSkills(skillSet);
      setCourseNames(courseSet);
    }
  }, [coattainmentData]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCoattainmentData([]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API}/coattainment/${batchId}/${semesterId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch coattainment data.");
      }

      const data = await response.json();
      console.log(data);
      setCoattainmentData(data.data || []);
    } catch (error) {
      setError("Error retrieving coattainment data.");
    }
  };

  const calculateAverages = () => {
    const totalStudents = coattainmentData.length;
    if (totalStudents === 0) return {};

    let cieTotal = 0,
      seeTotal = 0;
    let courseTotals = {};

    coattainmentData.forEach((student) => {
      [...skills].forEach((skill) => {
        cieTotal += student.skills?.[skill]?.CIE ?? 0;
        seeTotal += student.skills?.[skill]?.see ?? 0;
      });

      [...courseNames].forEach((course) => {
        if (!courseTotals[course]) courseTotals[course] = 0;
        courseTotals[course] += student.courses?.[course] ?? 0;
      });
    });

    return {
      avgCIE: (cieTotal / (totalStudents * skills.size)).toFixed(2),
      avgSEE: (seeTotal / (totalStudents * skills.size)).toFixed(2),
      avgCourses: Object.fromEntries(
        Object.entries(courseTotals).map(([course, total]) => [
          course,
          (total / totalStudents).toFixed(2),
        ])
      ),
    };
  };

  function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(coattainmentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Coattainment Data");
    XLSX.writeFile(workbook, "CoattainmentData.xlsx");
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-6xl p-6 shadow-xl bg-white rounded-lg">
        {error && <p className="text-red-600 mt-4">{error}</p>}
        {!coattainmentData.length > 0 ? (
          <form onSubmit={onSubmit} className="flex justify-center">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
            >
              Fetch Coattainment Data
            </button>
          </form>
        ) : (
          <div>
            <div className="flex justify-between items-center p-2">
              <h3 className="text-xl font-bold mb-4">Coattainment Results</h3>
              <button
                className="bg-gray-600 text-xl p-2 text-white rounded-md cursor-pointer"
                onClick={exportToExcel}
              >
                Download Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th rowSpan="2" className="border p-2">
                      Roll No
                    </th>
                    <th rowSpan="2" className="border p-2">
                      Name
                    </th>
                    {[...skills].map((skill) => (
                      <th
                        key={`skill-${skill}`}
                        colSpan={
                          Object.keys(
                            coattainmentData[0]?.skills?.[skill]?.pt || {}
                          ).length + 2
                        }
                        className="border p-2"
                      >
                        {skill}
                      </th>
                    ))}
                    {[...courseNames].map((course) => (
                      <th
                        rowSpan="2"
                        key={`course-${course}`}
                        className="border p-2"
                      >
                        {course}
                      </th>
                    ))}
                    
                  </tr>
                  <tr className="bg-gray-100">
                    {[...skills].map((skill) => {
                      const ptTypes = Object.keys(
                        coattainmentData[0]?.skills?.[skill]?.pt || {}
                      );
                      return (
                        <React.Fragment key={`header-${skill}`}>
                          {ptTypes.map((ptType) => (
                            <th
                              key={`${skill}-${ptType}`}
                              className="border p-2"
                            >
                              {ptType}
                            </th>
                          ))}
                          <th key={`${skill}-cie`} className="border p-2">
                            CIE
                          </th>
                          <th key={`${skill}-see`} className="border p-2">
                            SEE
                          </th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {coattainmentData.map((student) => (
                    <tr key={student.rollno} className="text-center">
                      <td className="border p-2">{student.rollno}</td>
                      <td className="border p-2">{student.name}</td>
                      {[...skills].map((skill) => {
                        const ptTypes = Object.keys(
                          student.skills?.[skill]?.pt || {}
                        );
                        return (
                          <React.Fragment
                            key={`data-${student.rollno}-${skill}`}
                          >
                            {ptTypes.map((ptType) => (
                              <td
                                key={`${student.rollno}-${skill}-${ptType}`}
                                className="border p-2"
                              >
                                {student.skills?.[skill]?.pt?.[ptType] ?? "-"}
                              </td>
                            ))}
                            <td className="border p-2">
                              {student.skills?.[skill]?.CIE ?? "-"}
                            </td>
                            <td className="border p-2">
                              {student.skills?.[skill]?.see ?? "-"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      {[...courseNames].map((course) => (
                        <td
                          key={`course-${student.rollno}-${course}`}
                          className="border p-2"
                        >
                          {student.courses?.[course] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td className="border p-2">Class Average</td>
                    <td className="border p-2">-</td>
                    {/* Empty cell for alignment */}
                    {[...skills].map((skill) => {
                      return (
                        <React.Fragment key={`average-${skill}`}>
                          <td className="border p-2">
                            {(
                              coattainmentData.reduce(
                                (sum, student) =>
                                  sum + (student.skills?.[skill]?.CIE || 0),
                                0
                              ) / coattainmentData.length
                            ).toFixed(2)}
                          </td>
                          <td className="border p-2">
                            {(
                              coattainmentData.reduce(
                                (sum, student) =>
                                  sum + (student.skills?.[skill]?.SEE || 0),
                                0
                              ) / coattainmentData.length
                            ).toFixed(2)}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    {[...courseNames].map((course) => {
                      const courseAvg = (
                        coattainmentData.reduce(
                          (sum, student) =>
                            sum + (student.courses?.[course] || 0),
                          0
                        ) / coattainmentData.length
                      ).toFixed(2);
                      return (
                        <td key={`avg-course-${course}`} className="border p-2">
                          {courseAvg}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectCoatt;
