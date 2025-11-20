import { useState, useEffect } from "react";
import GrantsFormStep from "./GrantsFormStep.jsx";
import GrantsTable from "./GrantsTable.jsx";
import { getGrants } from "../../api/grants_api_imports.js";
import { useForm } from "react-hook-form";

export default function GrantsPage() {
    const [grants, setGrants] = useState([]);

    const { control, formState: { errors } } = useForm({
        defaultValues: {
            grants: []   
        }
    });

    useEffect(() => {
        getGrants()
            .then((response) => {
                setGrants(response.data);
            })
            .catch((error) => console.error("Failed to load grants:", error));
    }, []);

    return (
        <div>
            <h2>Grants Page</h2>
            <GrantsTable grants={grants} setGrants={setGrants}/>
                <GrantsFormStep 
                    form_id={2}
                    control={control}
                    errors={errors}
                />

                <button type="submit">Submit</button>
        </div>
    );
}