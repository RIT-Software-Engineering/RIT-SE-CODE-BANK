// components/profile/form-components/CandidateFormFields.js
"use client";
import React from "react";
import { useWatch } from "react-hook-form";
import InputField from "./InputField";

const formLabel = "block text-sm font-medium text-slate-700 mb-1";
const formLegend = "text-base font-semibold text-slate-800";
const inputField = "w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

export default function CandidateFormFields({ register, errors, control, courseOptions }) {
  const isEmployeeValue = useWatch({ control, name: "isEmployee" });
  const graduateStatus = useWatch({ control, name: "graduateStatus" });

  return (
    <>
      <InputField
        id="major"
        label="Major"
        placeholder="Enter Major"
        registerProps={register("major", { required: "Major is required." })}
        error={errors.major}
      />
      <fieldset className="space-y-4">
        <div>
          <label className={formLabel}>
            Graduate Status <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">
            {["UNDERGRADUATE", "GRADUATE"].map((status) => (
              <label key={status} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  {...register("graduateStatus", { required: "Please select a status." })}
                  value={status}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700">{status}</span>
              </label>
            ))}
          </div>
          {errors.graduateStatus && <p className="text-red-500 text-xs mt-1">{errors.graduateStatus.message}</p>}
        </div>
        {graduateStatus === "UNDERGRADUATE" && (
          <div>
            <label htmlFor="yearLevel" className={formLabel}>
              Year Level <span className="text-red-500">*</span>
            </label>
            <select
              id="yearLevel"
              {...register("yearLevel", { required: "Please select your year level." })}
              className={`${inputField} ${errors.yearLevel ? "border-red-500" : "border-slate-300"}`}
            >
              <option value="" disabled>Select Year...</option>
              {[2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            {errors.yearLevel && <p className="text-red-500 text-xs mt-1">{errors.yearLevel.message}</p>}
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend className={formLegend}>
          Courses Taken <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
          {courseOptions.map((course) => (
            <label key={course.courseCode} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("courses", { required: "Select at least one course." })}
                value={course.courseCode}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700">{`${course.courseCode}: ${course.name}`}</span>
            </label>
          ))}
        </div>
        {errors.courses && <p className="text-red-500 text-xs mt-1">{errors.courses.message}</p>}
      </fieldset>
      <fieldset>
        <legend className={formLegend}>
          Are you currently or have you ever been a Course Assistant? <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-col sm:flex-row sm:space-x-8 mt-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="radio" {...register("isEmployee")} value="yes" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-slate-700">Yes</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="radio" {...register("isEmployee")} value="no" className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-slate-700">No</span>
          </label>
        </div>
      </fieldset>
      {isEmployeeValue === "yes" && (
        <fieldset>
          <legend className={formLegend}>
            Courses Worked For <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
            {courseOptions.map((course) => (
              <label key={`worked-${course.courseCode}`} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("coursesWorked", {
                    validate: (value) => isEmployeeValue === "yes" && (!value || value.length === 0) ? "Select at least one course you've worked for." : true,
                  })}
                  value={course.courseCode}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700">{`${course.courseCode}: ${course.name}`}</span>
              </label>
            ))}
          </div>
          {errors.coursesWorked && <p className="text-red-500 text-xs mt-1">{errors.coursesWorked.message}</p>}
        </fieldset>
      )}
    </>
  );
}
