export const TIME_ZONE = "America/New_York";
const LATEST_NOTIFY_HOUR = 20; // 8:00pm Eastern time
const ONE_DAY_MS = 86400000;


/**
 * How far campus time is from UTC at a given moment in milliseconds.
 * @param {*} date - the moment to measure the offset at
 * @returns {number} - offset in milliseconds between campus time and UTC
 */
function zoneOffsetMs(date){
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone: TIME_ZONE, hourCycle: 'h23',
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        }).formatToParts(date).map(part => [part.type, part.value])
    );
    const ritClockUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return ritClockUtc - date.getTime();
}

/**
 * Converts a given day to a string in the format 'YYYY-MM-DD'.
 * @param {*} day
 * @returns {string}
 */
function dayString(day){
    if (!day) return '';
    if (typeof day === 'string'){
        return day.slice(0, 10);
    }
    return day.toISOString().slice(0, 10);
}

/**
 * Gets the exact moment it is {hour}:00 at the campus' timezone on a given day.
 * It first calculates the reading in UTC and then adjusts it to the campus 
 * timezone (first by the measured offset, then by a rough reading).
 * @param {string} day - calendar day as "YYYY-MM-DD"
 * @param {number} hour - hour on the campus clock (0-23)
 * @returns {Date} - the instant
 */
export function campusInstant(day, hour=0){
    const clockReadUtc = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00Z`);
    const roughInstant = new Date(clockReadUtc.getTime() - zoneOffsetMs(clockReadUtc));
    return new Date(clockReadUtc.getTime() - zoneOffsetMs(roughInstant));
}

/**
 * Calculates the latest time a notification can be scheduled for: 8 pm ET the day before the event date
 * @param {Date|string} eventDate - The date of the event (either "YYYY-MM-DD" or a Date object)
 * @returns {Date} - The cutoff time
 */
export function latestNotifyTime(eventDate){
    const prev = new Date(Date.parse(dayString(eventDate) + 'T00:00:00Z') - ONE_DAY_MS).toISOString().slice(0, 10);
    return campusInstant(prev, LATEST_NOTIFY_HOUR);
}

// in the future, this would have an option to return a simulated day/time 
/**
 * The current moment for the course. Currently only returns the real current time.
 * @returns {Date}
 */
export default function courseNow(){
    return new Date();
}