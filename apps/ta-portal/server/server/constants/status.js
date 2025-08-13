const applicationStatusStringToEnum = {
    "Applied": 'APPLIED',
    "Accepted Offer": 'ACCEPTED_OFFER',
    "Declined Offer": 'DECLINED_OFFER',
    "Hired": 'HIRED',
    "Pending Offer": 'PENDING_OFFER',
    "Interview": 'INTERVIEW',
    "Onhold": 'ONHOLD',
    "Rejected": 'REJECTED',
    "Inactive": 'INACTIVE'
}

const positionStatusStringToEnum = {
    "Active":'ACTIVE',
    "Open":'OPEN',
    "Filled":'FILLED',
    "Onhold":'ONHOLD',
    "Inactive":'INACTIVE',
    "Pending Approval":'PENDING_APPROVAL',
    "Rejected":'REJECTED'
}


module.exports = {
    applicationStatusStringToEnum,
    positionStatusStringToEnum
}