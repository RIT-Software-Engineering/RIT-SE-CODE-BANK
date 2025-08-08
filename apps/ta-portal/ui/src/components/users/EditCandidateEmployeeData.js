// components/users/EditCandidateEmployeeData.js
"use client";
import React from "react";
import InputField from "@/components/common/fields/InputField";
import SelectField from "@/components/common/fields/SelectField";

/**
 * Component for the first step of the form for candidates and employees
 * @param {function} register - The form register function.
 * @param {object} errors - The form errors object.
 * @param {object} watchedStatus - The form watched status object.
 * @returns {JSX.Element} The rendered Step1 component.
 */
export default function EditCandidateEmployeeData({ register, errors, watchedStatus }) {
    return (
        <fieldset className="space-y-4 animate-fade-in">

        {/* --- EDITABLE FIELDS --- */}
         <InputField
            id="uid"
            label="User ID"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter User ID"
            registerProps={register("uid", {required: "A User ID is required."})}
            maxLength={9}
            required={true}
            error={errors.uid}
        />
        <InputField
            id="fname"
            label="First Name"
            placeholder="Enter First Name"
            registerProps={register("fname", { required: "First name is required." })}
            required={true}
            error={errors.firstName}
        />
        <InputField
            id="lname"
            label="Last Name"
            placeholder="Enter Last Name"
            registerProps={register("lname", { required: "Last name is required." })}
            required={true}
            error={errors.lastName}
        />
        <InputField
            id="email"
            label="Email"
            placeholder="Enter Email"
            registerProps={register("email", { required: "An email address is required." })}
            required={true}
            error={errors.email}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
            id="pronouns"
            label="Pronouns"
            placeholder="Enter Pronouns"
            registerProps={register("pronouns", { required: "Pronouns are required." })}
            required={true}
            error={errors.pronouns}
            />
            <InputField
            id="major"
            label="Major"
            placeholder="Enter Major"
            registerProps={register("major", { required: "Major is required." })}
            required={true}
            error={errors.major}
            />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <SelectField
            id="graduateStatus"
            label="Academic Status"
            required={true}
            registerProps={register("graduateStatus", { required: "Academic status is required." })}
            error={errors.graduateStatus}
            >
            <option value="">Select Status...</option>
            <option value="UNDERGRADUATE">Undergraduate</option>
            <option value="GRADUATE">Graduate</option>
            </SelectField>

            {watchedStatus === "UNDERGRADUATE" && (
            <SelectField
                id="yearLevel"
                label="Year Level"
                required={true}
                registerProps={register("yearLevel", { required: "Year level is required for undergraduates." })}
                error={errors.yearLevel}
            >
                <option value="">Select Year...</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
                <option value="5">Fifth Year</option>
            </SelectField>
            )}
        </div>
        </fieldset>
    );
}