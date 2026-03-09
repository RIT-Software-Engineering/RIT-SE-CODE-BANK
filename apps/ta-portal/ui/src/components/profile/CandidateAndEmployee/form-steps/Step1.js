// src/components/profile/form-steps/CandidateAndEmployee/Step1.js
"use client";
import React from "react";
import InputField from "../../../common/fields/InputField";
import SelectField from "../../../common/fields/SelectField";
import { MenuItem, Typography, Box, Divider } from "@mui/material";

/**
 * Component for Step 1 of the Candidate and Employee form.
 * This form step includes fields for personal information and academic details.
 * @param {function} register - The form register function.
 * @param {object} errors - The form errors object.
 * @param {string} watchedStatus - The watched value of the 'graduateStatus' field.
 * @param {function} watch - The form watch function.
 * @returns {JSX.Element} The rendered Step1 component.
 */
export default function Step1CandidateAndEmployee({
  register,
  errors,
  watchedStatus,
  watch,
}) {
  const currentValues = watch ? watch() : {};

  return (
    <fieldset className="space-y-8 animate-fade-in">
      <Box mb={4}>
        <Typography variant="h1" mb={2}>
          Personal Information
        </Typography>
        <Typography variant="body1">
          Please provide your basic information and academic details.
        </Typography>
      </Box>

      {/* First + Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="fname"
          label="First Name"
          placeholder="Enter First Name"
          registerProps={register("fname", { required: "First name is required." })}
          required
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
          required
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
      </div>

      {/* User ID + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputField
            id="uid"
            label="User ID"
            type="text"
            inputMode="numeric"
            placeholder="Enter User ID"
            registerProps={register("uid", { required: "A User ID is required." })}
            maxLength={9}
            required
            error={errors.uid}
            sx={(theme) => ({
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white",
            }
          })}
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
            registerProps={register("email", { required: "An email is required." })}
            required
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
          <Typography variant="smalltext" mt={1} fontStyle="italic">
            Use your RIT email address
          </Typography>
        </div>
      </div>

      {/* Pronouns + Major */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="pronouns"
          label="Pronouns"
          placeholder="e.g., he/him, she/her, they/them"
          registerProps={register("pronouns", { required: "Pronouns are required." })}
          required
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
          id="major"
          label="Major"
          placeholder="Enter your major/program"
          registerProps={register("major", { required: "Major is required." })}
          required
          error={errors.major}
          sx={(theme) => ({
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white",
            }
          })}
        />
      </div>

      {/* Academic Info */}
      <Box pt={4}>
        <Divider sx={{ mb: 4 }} />

        <Box mb={3}>
          <Typography variant="h2" mb={2}>
            Academic Status
          </Typography>
          <Typography variant="body1">
            Select your current academic level and year if applicable.
          </Typography>
        </Box>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            id="graduateStatus"
            label="Academic Status"
            required
            registerProps={register("graduateStatus", {
              required: "Academic status is required.",
            })}
            value={currentValues.graduateStatus || ""}
            error={errors.graduateStatus}
            sx={(theme) => ({
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white"
            })}
          >
            <MenuItem value="">
              <em>Select Status...</em>
            </MenuItem>
            <MenuItem value="UNDERGRADUATE">Undergraduate</MenuItem>
            <MenuItem value="GRADUATE">Graduate</MenuItem>
          </SelectField>

          {watchedStatus === "UNDERGRADUATE" && (
            <div className="animate-fade-in">
              <SelectField
                id="yearLevel"
                label="Year Level"
                required
                registerProps={register("yearLevel", {
                  required: "Year level is required for undergraduates.",
                })}
                value={currentValues.yearLevel || ""}
                error={errors.yearLevel}
                sx={(theme) => ({
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white"
            })}
              >
                <MenuItem value="">
                  <em>Select Year...</em>
                </MenuItem>
                <MenuItem value="2">Second Year</MenuItem>
                <MenuItem value="3">Third Year</MenuItem>
                <MenuItem value="4">Fourth Year</MenuItem>
                <MenuItem value="5">Fifth Year</MenuItem>
              </SelectField>
              <Typography variant="smalltext" mt={1} fontStyle="italic">
                Select your current academic year
              </Typography>
            </div>
          )}
        </div>
      </Box>
    </fieldset>
  );
}