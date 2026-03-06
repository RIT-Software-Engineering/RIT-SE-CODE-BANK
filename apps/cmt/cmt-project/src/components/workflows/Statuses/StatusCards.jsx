import { Check, Pencil, X } from 'lucide-react'
import { Card } from 'react-bootstrap'

/**
 * TODO: this should be in a design choices document? but its so small >w<
 *
 * These functions would be difficult to merge because tailwind classes cannot be dynamic unless you:
 *  * manually specified colors, which would make it harder to change the colors without copy-pasting from an online color palette
 *  * preloaded every tailwind class, which would be a terribly large css file
 *
 * If you want to change something about all 3 of these and really don't want to copy-paste, you can hold alt, then click at the same point of each card.
 * Then, you will have 3 cursors editing in parallel!
 */
export function StatusCard({ stateType }) {
    if (stateType === 'notStarted') return <StatusCardNotStarted />
    else if (stateType === 'inProgress') return <StatusCardInProgress />
    else if (stateType === 'completed') return <StatusCardCompleted />
    else throw Error(`Unrecognized stateType: ${stateType}`)
}

export function StatusCardCompleted() {
    return (
        <Card>
            <Card.Body style={{ backgroundColor: `` }} className={`bg-green-500 text-white`}>
                <div className='flex flex-col w-24 items-center h-full justify-evenly'>
                    <Check />
                    <p className='my-0'>Completed!</p>
                </div>
            </Card.Body>
        </Card>
    )
}

export function StatusCardInProgress() {
    return (
        <Card>
            <Card.Body style={{ backgroundColor: `` }} className={`bg-yellow-500 text-white`}>
                <div className='flex flex-col w-24 items-center h-full justify-evenly'>
                    <Pencil />
                    <p className='my-0'>In progress</p>
                </div>
            </Card.Body>
        </Card>
    )
}

export function StatusCardNotStarted() {
    return (
        <Card>
            <Card.Body style={{ backgroundColor: `` }} className={`bg-red-500 text-white`}>
                <div className='flex flex-col w-24 items-center h-full justify-evenly'>
                    <X />
                    <p className='my-0'>Not Started</p>
                </div>
            </Card.Body>
        </Card>
    )
}
