apps/workflow/server/
./index.js, scoop portal has really long urls that say theyre specific but they shouldnt be
./dockerfile, different ports + different run cmd
./prisma, example_seed.js is a bad name for something project-specific
./prisma, for some reason cmt has example_scoop_portal_seed.js, which appears to be an out of date version of the above file
./prisma/schema.prisma, addition of createdAt and ActionStateSubmission. So SCOOPPortal DOES store submissions in workflows. ehhh
./prisma/seed.js SCOOPPortal has a seed.js but it has different contents then CMT's seed.js. I renamed our seed.js to oldSeed.js since we can probably just delete it
./api/routes/action.js, line 71: `return res.json(toReturn.map((action) => {return action}));` used to call exportAction. might be bad news for scoopportal
./api/routs/states.js, trainwreck
./api/helpers/actions.js double check export action
./api/helpers/workflows.js we put a ? on tags?.map
./api/routs/workflows.js, line 146,
scoopportal has
if (tags) {
    baseActionData.tags = {

cmt has
if (tags) {
    workflowData.tags = {

./.nx/mxw.js, what on earth is this file doing


# things for scoopportal to consider changing
apps/workflow/server/index.js, scoop portal has really long urls that say theyre specific but they shouldnt be
scoopportal & cmt have different workflows ports. correct port: 5011
scoopportal's workflows seed file was renamed to scoop-portal-seed.js (probably breaks dev setups)
/apps/workflow/server/api/routes/workflows.js line 240 (146 in scoopportal dev). scoopportal adds tags to the base action, while cmt adds tags to the workflowAttribute. to align with the schema (actions dont have tags), we should prefer to add tags to the workflowAttribute. scoopportal's old code is commented out, and the update call on line 269 is where the update in question actually happens

