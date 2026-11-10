import React from 'react'
import { createRoot } from 'react-dom/client'
import { Box, CssBaseline, Divider, Stack, Typography } from '@mui/material'
import { BasicExample } from './ReactBootstrapExample'
import { MaterialUIExample } from './MaterialUIExample'

function ExampleApp() {
	return (
		<>
			<CssBaseline />
			<div className='container py-5'>
				<Stack spacing={5}>
					<Box>
						<Typography variant='h3' gutterBottom>
							Workflow Components Examples
						</Typography>
						<Typography variant='body1' color='text.secondary'>
							Two package-local examples using the same static workflow fixture.
						</Typography>
					</Box>

					<section>
						<Typography variant='h4' gutterBottom>
							React Bootstrap
						</Typography>
						<BasicExample />
					</section>

					<Divider />

					<section>
						<Typography variant='h4' gutterBottom>
							Material UI
						</Typography>
						<MaterialUIExample />
					</section>
				</Stack>
			</div>
		</>
	)
}

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<ExampleApp />
	</React.StrictMode>
)
