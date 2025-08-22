// components/profile/form-steps/EmployerAndAdmin/Step1.js
"use client";
import React from "react";
import InputField from "../../../common/fields/InputField";
import { Typography, Box } from "@mui/material";

/**
 * Component for the first step (and currently only step) of the form for employers and admins.
 * This form step includes fields for personal information.
 * @param {object} props - The component props.
 * @param {function} props.register - The form register function.
 * @param {object} props.errors - The form errors object.
 * @returns {JSX.Element} The rendered Step1 component.
 */
export default function Step1EmployerAndAdmin({ register, errors }) {
  return (
    <fieldset className="space-y-8 animate-fade-in">
      <Box mb={4}>
        <Typography variant="h1" mb={2}>
          Personal Information
        </Typography>
        <Typography variant="body1">
          Please provide your basic contact and department information.
        </Typography>
      </Box>

      {/* --- EDITABLE FIELDS --- */}
      {/* First + Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="fname"
          label="First Name"
          placeholder="Enter First Name"
          registerProps={register("fname", {
            required: "First name is required.",
          })}
          required={true}
          error={errors.fname}
        />
        <InputField
          id="lname"
          label="Last Name"
          placeholder="Enter Last Name"
          registerProps={register("lname", {
            required: "Last name is required.",
          })}
          required={true}
          error={errors.lname}
        />
      </div>

      {/* User ID + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputField
            id="uid"
            label="User ID"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter User ID"
            registerProps={register("uid", {
              required: "A User ID is required.",
            })}
            maxLength={9}
            required={true}
            error={errors.uid}
          />
          <Typography variant="smalltext" mt={1} fontStyle="italic">
            Enter your 9-digit RIT ID number
          </Typography>
        </div>
        <div>
          <InputField
            id="email"
            label="Email"
            type="email"
            placeholder="Enter Email"
            registerProps={register("email", {
              required: "An email is required.",
            })}
            required={true}
            error={errors.email}
          />
          <Typography variant="smalltext" mt={1} fontStyle="italic">
            Use your RIT email address
          </Typography>
        </div>
      </div>

      {/* Pronouns + Department */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="pronouns"
          label="Pronouns"
          placeholder="e.g., he/him, she/her, they/them"
          registerProps={register("pronouns", {
            required: "Pronouns are required.",
          })}
          required={true}
          error={errors.pronouns}
        />
        <InputField
          id="department"
          label="Department"
          placeholder="Enter Department"
          registerProps={register("department", {
            required: "Department is required.",
          })}
          required={true}
          error={errors.department}
        />
      </div>
    </fieldset>
  );
}