import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
// import { CSVLink } from 'react-csv';         // commented out due to not needing csvs


export default function Timecard() {
    /**
    * Default structure for each day in the timecard (Friday -> Thursday)
    * Each entry holds:
    *  - day: Name of day
    *  - date: Selected date string (YYYY-MM-DD)
    *  - ins: Array of three "Time In" strings (HH:mm)
    *  - outs: Array of three "Time Out" strings (HH:mm)
    *  - total: Computed total hours for th eday
    */
    const defaultTimecard = [
        { day: 'Friday',    date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Saturday',  date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Sunday',    date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Monday',    date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Tuesday',   date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Wednesday', date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
        { day: 'Thursday',  date: '', ins: ['', '', ''], outs: ['', '', ''], total: 0 },
    ];


    /**
     * Timecard state holds the current aray of day entries
     * setTimecard updates this state
     * Initialized from localStorage or defaultTimecard
     */
    const [timecard, setTimecard] = useState(() => {
        const saved = localStorage.getItem('timecard');
        return saved ? JSON.parse(saved) : defaultTimecard;
    });


    /**
     * Sync effect - whenever timecard changes, persist to localStorage
     */
    useEffect(() => {
        localStorage.setItem('timecard', JSON.stringify(timecard));
    }, [timecard]);


    /**
     * Calculate the difference in hours between two time string ("HH:mm")
     * @param {string} startStr - Start time in "HH:mm" format
     * @param {string} endStr - End time in "HH:mm" format
     * @returns {number} Difference in houurs (fractional)
     */
    const hoursDiff = (startStr, endStr) => {
        // if either time is missing no hours are calculated
        if (!startStr || !endStr) return 0;

        // split "HH:mm" into hours and minutes -> convert to numbers
        const [sh, sm] = startStr.split(':').map(Number);
        const [eh, em] = endStr.split(':').map(Number);
    
        // create Date objects for the day and set their hours/minutes
        let start = new Date();
        let end = new Date();
        start.setHours(sh, sm, 0, 0);
        end.setHours(eh, em, 0, 0);

        // if end is before start, assume it rolls past midnight (adds one day)
        // will be removed since students cannot work past midnight
        if (end < start) end.setDate(end.getDate() + 1);
    
        // converts milliseconds to hours
        return (end - start) / 3600000;
    };


    /**
     * Update a single time input and recalculate that day's total hours
     * @param {number} dayIdx - Index of day in timecard
     * @param {number} pairIdx - Which in/out pair (0-2)
     * @param {'in|out'} type - Field type (either "in" or "out")
     * @param {string} value  - New time value HH:mm
     */
    const handleTimeChange = (dayIdx, pairIdx, type, value) => {
        setTimecard(prev => {
        // copy previous state array
        const newTS = [...prev];
        // copy the specific day's object
        newTS[dayIdx] = { ...newTS[dayIdx] };

        // update the appropriate time field
        if (type === 'in') {
            newTS[dayIdx].ins[pairIdx] = value;
        } else {
            newTS[dayIdx].outs[pairIdx] = value;
        }

        // recalculate the day's total hours by summing each in/out pair
        let dayTotal = 0;
        for (let i = 0; i < 3; i++) {
            // compute hours for pair i and add to dayTotal
            dayTotal += hoursDiff(
            newTS[dayIdx].ins[i],   // start time
            newTS[dayIdx].outs[i]); // end time
        }

        // store new total back into day entry
        newTS[dayIdx].total = dayTotal;
        // return updated timecard array to update state
        return newTS;
        });
    };


    /**
     * Update the selected date for a specific day
     * @param {number} dayIdx - Index of day
     * @param {string} value - New date string (YYYY-MM-DD)
     */
    const handleDateChange = (dayIdx, value) => {
        setTimecard(prev => {
        const newTS = [...prev];
        newTS[dayIdx] = { ...newTS[dayIdx], date: value };
        return newTS;
        });
    };


    /**
     * Save current timecard state to localStorage with confirmation
     */
    const handleSave = () => {
        localStorage.setItem('timecard', JSON.stringify(timecard));
        alert('Timecard saved locally.');
    };


    /**
     * Clear all entries, reset to default, and remvoe from localStorage
     */
    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear all entries?')) {
        setTimecard(defaultTimecard);
        localStorage.removeItem('timecard');
        }
    };


    /**
     * Total hours worked over the entire week
     * Summed from each day's total
     */
    const weeklyTotal = timecard.reduce((sum, d) => sum + d.total, 0);


    /**
     * CSV export headers mapping labels to object keys
     */
    const csvHeaders = [
        { label: 'Day', key: 'day' },
        { label: 'Date', key: 'date' },
        { label: 'Time In 1', key: 'in1' },
        { label: 'Time Out 1', key: 'out1' },
        { label: 'Time In 2', key: 'in2' },
        { label: 'Time Out 2', key: 'out2' },
        { label: 'Time In 3', key: 'in3' },
        { label: 'Time Out 3', key: 'out3' },
        { label: 'Total (hrs)', key: 'total' },
        { label: 'Week Total (hrs)', key: 'weeklyTotal' }
    ];


    /**
     * Data formatted for CSV export including weekly total row
     */
    const csvData = timecard.map(d => ({
        day: d.day,
        date: d.date,
        in1: d.ins[0], out1: d.outs[0],
        in2: d.ins[1], out2: d.outs[1],
        in3: d.ins[2], out3: d.outs[2],
        total: d.total.toFixed(2),
        weeklyTotal: ''
    }));
    csvData.push({
        day: 'Week Total', date: '', in1: '', out1: '', in2: '', out2: '', in3: '', out3: '',
        total: '', weeklyTotal: weeklyTotal.toFixed(2)
    });


    /**
     * Table styling for layout
     */
    const tableStyle = { borderCollapse: 'collapse', width: '100%' };
    
    /**
     * Header cell styling
     */
    const thStyle = { border: '1px solid #ccc', padding: '8px', backgroundColor: '#f2f2f2' };
    
    /**
     * Regular cell styling
     */
    const tdStyle = { border: '1px solid #ccc', padding: '8px' };
    
    /**
     * Total cell styling
     */
    const totalTdStyle = { border: '1px solid #ccc', padding: '12px' };


    return (
        <div class="bg-white">
        <Header />
        <div>
        <h2>Weekly Timecard</h2>
        <table style={tableStyle}>
            {/* Table header with column labels */}
            <thead>
            <tr>
                <th style={thStyle}>Day</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Time In 1</th><th style={thStyle}>Time Out 1</th>
                <th style={thStyle}>Time In 2</th><th style={thStyle}>Time Out 2</th>
                <th style={thStyle}>Time In 3</th><th style={thStyle}>Time Out 3</th>
                <th style={thStyle}>Total (hrs)</th>
            </tr>
            </thead>
            {/* Table body - one row per day */}
            <tbody>
            {timecard.map((dayEntry, dayIdx) => (
                <tr key={dayEntry.day}>
                {/* Day label cell */}
                <td style={tdStyle}>{dayEntry.day}</td>
                {/* Date picker cell */}
                <td style={tdStyle}>
                    <input
                    type="date"
                    value={dayEntry.date}
                    onChange={e => handleDateChange(dayIdx, e.target.value)}
                    />
                </td>
                {/* Time In / Time Out pairs */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <React.Fragment key={i}>
                    {/* Time In input */}
                    <td style={tdStyle}>
                        <input
                        type="time"
                        value={dayEntry.ins[i]}
                        onChange={e => handleTimeChange(dayIdx, i, 'in', e.target.value)}
                        style={{ width: '100%' }}
                        />
                    </td>
                    {/* Time Out input */}
                    <td style={tdStyle}>
                        <input
                        type="time"
                        value={dayEntry.outs[i]}
                        onChange={e => handleTimeChange(dayIdx, i, 'out', e.target.value)}
                        style={{ width: '100%' }}
                        />
                    </td>
                    </React.Fragment>
                ))}
                {/* Daily total hours cell */}
                <td style={totalTdStyle}>{dayEntry.total.toFixed(2)}</td>
                </tr>
            ))}
            </tbody>
            {/* Table footer containing weekly total hours */}
            <tfoot>
            <tr>
                <td colSpan="8" style={tdStyle}><strong>Week Total:</strong></td>
                {/* Weekly total styling - highlights total hours red if it exceeds "max" weekly hours */}
                <td style={{ ...totalTdStyle, color: weeklyTotal > 10 ? 'red' : 'black' }}>
                {weeklyTotal.toFixed(2)} hrs
                </td>
            </tr>
            </tfoot>
        </table>
        {/* Buttons - Save, Clear, Export */}
        <div style={{ marginTop: '20px' }}>
            {/* Save button */}
            <button onClick={handleSave} style={{ padding: '8px 16px', marginRight: '12px' }}>
            Save
            </button>
            {/* Clear button */}
            <button onClick={handleClear} style={{ padding: '8px 16px', marginRight: '12px' }}>
            Clear
            </button>
            {/* CSVLink to trigger CSV download - commented out due to not needing to export to CSV at the moment */}
            {/* <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename="timecard.csv"
            style={{ padding: '8px 16px', backgroundColor: '#eee', border: '1px solid #ccc', textDecoration: 'none' }}
            >
            Export to CSV
            </CSVLink> */}
        </div>
        </div>
        <Footer />
        </div>
    );
}