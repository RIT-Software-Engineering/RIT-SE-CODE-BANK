import { Download, FileAudio, FileSpreadsheet, FileStack, FileText, FileVideo, Image } from 'lucide-react'
import { Badge, Button, Card } from 'react-bootstrap'
import { getResourceDownloadUrl } from './ResourceManager'
import { EditResourceModal, DeleteResourceModal } from './modals'

/**
 * Displays a resource as a card and allows a user to manage it
 * @param {{ resource: any, refresh: () => void }} props
 * @returns
 */
export function ResourceCard({ resource, refresh }) {
    return (
        <Card className='h-100'>
            <Card.Body className='flex flex-column'>
                <div className='flex align-items-start mb-2 w-max'>
                    <ResourceInfo resource={resource} />
                </div>
                <div>
                    <div className='flex justify-content-between'>
                        <div className='flex gap-2'>
                            <Button
                                variant='outline-primary'
                                size='sm'
                                href={getResourceDownloadUrl(resource.id)}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                <Download size={16} />
                            </Button>
                            <EditResourceModal resource={resource} refresh={refresh} />
                            <DeleteResourceModal resource={resource} refresh={refresh} />
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    )
}

/**
 * Displays a resource as a card and allows a user to manage it as well as select it
 * @param {{ resource: any, refresh: () => void, selected: any, setSelected: React.Dispatch<React.SetStateAction<any>> }} props
 */
export function SelectableResourceCard({ resource, refresh, selected, setSelected }) {
    const isSelected = resource.id === selected?.id
    
    return (
        <Card 
            className={`h-100 cursor-pointer ${isSelected ? 'border-primary' : 'border-secondary'}`}
            onClick={() => setSelected(resource)}
        >
            <Card.Body className='flex flex-column'>
                <div className='flex items-center mb-2 w-max'>
                    <ResourceInfo resource={resource} />
                    {isSelected && <Badge pill className="ml-4">Selected</Badge>}
                </div>
                <div>
                    <div className='flex justify-content-between'>
                        <div className='flex gap-2' onClick={e => e.stopPropagation()}>
                            <Button
                                variant='outline-primary'
                                size='sm'
                                href={getResourceDownloadUrl(resource.id)}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                <Download size={16} />
                            </Button>
                            {/* TODO: make these not require modals so that they can be uncommented (avoid double modal in session internal resource select)  */}
                            {/* <EditResourceModal resource={resource} refresh={refresh} />
                            <DeleteResourceModal resource={resource} refresh={refresh} /> */}
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    )
}

function ResourceInfo({ resource }) {
    function getFileIcon(mimeType) {
        if (mimeType.includes('pdf') || mimeType.includes('word')) return <FileText />
        if (mimeType.includes('image')) return <Image />
        if (mimeType.includes('video')) return <FileVideo />
        if (mimeType.includes('audio')) return <FileAudio />
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet />
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FileStack />
        return '📎'
    }

    return (
        <>
            <div className='mr-3'>{getFileIcon(resource.mimeType)}</div>
            <div className='flex-grow-1'>
                <Card.Title className='mb-1' style={{ fontSize: '14px' }}>
                    {resource.name}
                </Card.Title>
                <Card.Text className='text-muted' style={{ fontSize: '12px' }}>
                    {resource.filename}
                </Card.Text>
            </div>
        </>
    )
}
