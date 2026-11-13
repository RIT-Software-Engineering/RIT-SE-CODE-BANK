// Reads a CSV/TXT file and returns a flat list of trimmed, non-empty values.
export const parseCsvFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split("\n");
        const usernames = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            // Handle both single column and CSV with commas
            const values = line.split(",").map((v) => v.trim());
            usernames.push(...values.filter((v) => v));
          }
        }

        resolve(usernames);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });

export const parseJsonFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch (error) {
        reject(new Error("Invalid JSON file format"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });

// Opens a native file picker and calls onFile with the chosen file.
export const pickFile = (accept, onFile) => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = accept;
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
  };
  fileInput.click();
};
