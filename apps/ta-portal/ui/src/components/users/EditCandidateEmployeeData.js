// components/users/EditCandidateEmployeeData.js
"use client";
import React from "react";
import InputField from "@/components/common/fields/InputField";
import SelectField from "@/components/common/fields/SelectField";
import { Box, MenuItem } from "@mui/material";

/**
 * Component for editing data for candidates and employees within the admin form.
 * @param {function} register - The form register function.
 * @param {object} errors - The form errors object.
 * @param {string} watchedStatus - The watched value of the 'graduateStatus' field.
 * @param {function} watch - The form watch function.
 * @returns {JSX.Element} The rendered EditCandidateEmployeeData component.
 */
export default function EditCandidateEmployeeData({ register, errors, watchedStatus, watch }) {
    const currentValues = watch ? watch() : {};

    return (
        <Box component="fieldset" sx={{ border: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* --- EDITABLE FIELDS --- */}
            <InputField
                id="uid"
                label="User ID"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter User ID"
                registerProps={register("uid", { required: "A User ID is required." })}
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
                error={errors.fname}
            />
            <InputField
                id="lname"
                label="Last Name"
                placeholder="Enter Last Name"
                registerProps={register("lname", { required: "Last name is required." })}
                required={true}
                error={errors.lname}
            />
            <InputField
                id="email"
                label="Email"
                placeholder="Enter Email"
                registerProps={register("email", { required: "An email address is required." })}
                required={true}
                error={errors.email}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
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
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <SelectField
                    id="graduateStatus"
                    label="Academic Status"
                    required={true}
                    registerProps={register("graduateStatus", { required: "Academic status is required." })}
                    value={currentValues.graduateStatus || ''}
                    error={errors.graduateStatus}
                >
                    <MenuItem value=""><em>Select Status...</em></MenuItem>
                    <MenuItem value="UNDERGRADUATE">Undergraduate</MenuItem>
                    <MenuItem value="GRADUATE">Graduate</MenuItem>
                </SelectField>

                {watchedStatus === "UNDERGRADUATE" && (
                    <SelectField
                        id="yearLevel"
                        label="Year Level"
                        required={true}
                        registerProps={register("yearLevel", { required: "Year level is required for undergraduates." })}
                        value={currentValues.yearLevel || ''}
                        error={errors.yearLevel}
                    >
                        <MenuItem value=""><em>Select Year...</em></MenuItem>
                        <MenuItem value="2">Second Year</MenuItem>
                        <MenuItem value="3">Third Year</MenuItem>
                        <MenuItem value="4">Fourth Year</MenuItem>
                        <MenuItem value="5">Fifth Year</MenuItem>
                    </SelectField>
                )}
            </Box>
        </Box>
    );
}