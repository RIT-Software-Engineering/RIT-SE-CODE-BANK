"use client";

import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Search({ placeholder }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleSearch(term) {
    console.log(term);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    // <div className="relative flex flex-1 flex-shrink-0">
    //   <label htmlFor="search" className="sr-only">
    //     Search
    //   </label>
    //   <input
    //     className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
    //     placeholder={placeholder}
    //     onChange={(e) => {
    //       handleSearch(e.target.value);
    //     }}
    //     defaultValue={searchParams.get("query")?.toString()}
    //   />
    // </div>
    <FormControl variant="outlined" sx={{ height: "1.5rem" }}>
      <InputLabel htmlFor="outlined-adornment-search">{placeholder}</InputLabel>
      <OutlinedInput
        id="outlined-adornment-search"
        type="text"
        endAdornment={
          <InputAdornment position="end">
            <IconButton edge="end">{<SearchOutlinedIcon />}</IconButton>
          </InputAdornment>
        }
      />
    </FormControl>
  );
}
