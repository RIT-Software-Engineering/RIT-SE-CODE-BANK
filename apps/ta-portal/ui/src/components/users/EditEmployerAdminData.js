// components/users/EditEmployerAdminData.js
"use client";
import React from "react";
import InputField from "@/components/common/fields/InputField";
import { Box } from "@mui/material";

/** * Component for editing data for employers and admins within the admin form.
 * @param {function} register - The form register function.
 * @param {object} errors - The form errors object.
 * @returns {JSX.Element} The rendered EditEmployerAdminData component.
*/
export default function EditEmployerAdminData({ register, errors }) {
    return (
        <Box
            component="fieldset"
            className="animate-fade-in"
            sx={{
                border: 'none',
                p: 0,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 3
            }}
        >

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
                sx={(theme) => ({
                    "& .MuiOutlinedInput-root": {
                        backgroundColor:
                            theme.palette.mode === "dark"
                                ? ""
                                : "white",
                    }
                })} />
            <InputField
                id="fname"
                label="First Name"
                placeholder="Enter First Name"
                registerProps={register("fname", { required: "First name is required." })}
                required={true}
                error={errors.fname}
                sx={(theme) => ({
                    "& .MuiOutlinedInput-root": {
                        backgroundColor:
                            theme.palette.mode === "dark"
                                ? ""
                                : "white",
                    }
                })}
            />
            <InputField
                id="lname"
                label="Last Name"
                placeholder="Enter Last Name"
                registerProps={register("lname", { required: "Last name is required." })}
                required={true}
                error={errors.lname}
                sx={(theme) => ({
                    "& .MuiOutlinedInput-root": {
                        backgroundColor:
                            theme.palette.mode === "dark"
                                ? ""
                                : "white",
                    }
                })}
            />
            <InputField
                id="email"
                label="Email"
                placeholder="Enter Email"
                registerProps={register("email", { required: "An email address is required." })}
                required={true}
                error={errors.email}
                sx={(theme) => ({
                    "& .MuiOutlinedInput-root": {
                        backgroundColor:
                            theme.palette.mode === "dark"
                                ? ""
                                : "white",
                    }
                })}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <InputField
                    id="pronouns"
                    label="Pronouns"
                    placeholder="Enter Pronouns"
                    registerProps={register("pronouns", { required: "Pronouns are required." })}
                    required={true}
                    error={errors.pronouns}
                    sx={(theme) => ({
                        "& .MuiOutlinedInput-root": {
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? ""
                                    : "white",
                        }
                    })}

                />
                <InputField
                    id="department"
                    label="Department"
                    placeholder="Enter Department"
                    registerProps={register("department", { required: "Department is required." })}
                    required={true}
                    error={errors.department}
                    sx={(theme) => ({
                        "& .MuiOutlinedInput-root": {
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? ""
                                    : "white",
                        }
                    })}
                />
            </Box>
        </Box>
    );
}