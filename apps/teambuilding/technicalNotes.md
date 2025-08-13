#### Terminology 
- Manager: person that creates communities of people to form teams for. Think of a professor or project manager
- Community: A group of people. Think of a class
- Team: a group of people within a community
- User: a person that is put into communities and teams

#### Authentication
Currently there is zro authentication in the system. There is 2 places where this is needed:
- api endpoints:
        Currently there is no check if the right person is using any of the endpoints and this should be fixed at somepoint. It should be pretty similar to what is currently implimented in workflows using middleware
- the login:
    The login will evuenally be handled by RIT's Shibboleth (shib) so there is not really much point in doing anything farther with that as it will be replaced with Shib once that is working.

#### Unimplemented:
-  mockview:
    When logged in as an admin, you should be able to go to the manager page and be able to mock an admin to see what there view is like. And the same is true as well for managers when viewing the user page. This would be very similar to what is done in senior portal
- sorting algorithms:
    Currently you can only manually make teams 1 by 1 or to randomly create teams. Some other algoythms you could do is:
    * Some intergration with pearEval or rubricon to create teams based off of that input
    * some algorthym based off of the stable roommates problem to best match everyone together
- userView:
    A more indepth user view, as it currently only shows teams you are apart of. This could be expanded
- .env file to control what ports are used to run the backend and frontend. Currently it is hardcoded for the ui to call the backend at port 3000. As a result you have to run the backend first then the frontend for it to work proberly
 