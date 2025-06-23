INSERT INTO 
actions (
    semester,
    action_title, 
    action_target,
    short_desc,
    start_date, 
    due_date, 
    date_deleted,
    page_html,
    file_types,
    file_size
    )

VALUES
    (
        4,  -- semester (referencing semester_group)
        'Action 1',
        'individual',
        'This is the first test action for a project',
        '2025-01-22 12:00:00', -- start date
        '2025-05-19 11:59:59', -- due date
        '', -- date deleted. do we care about date deleted?
        '<h1>Take the individual test form</h1>
        <form class="ui form" action="/db/submitAction" method="POST" enctype="multipart/form-data">
            <label for="name">Name</label>
            <input name="name" type="text"/>

            <label for="email">Email</label>
            <input name="email" type="text"/>
       </form>
        ',
        '.png,.pdf,.jpg',
        5242880  -- 5MB file size limit
    ),
    (
        2,  -- semester (referencing semester_group)
        'Action sem 2',
        'admin',
        'This action should not show up',
        '2025-01-22 12:00:00', -- start date
        '2025-05-19 11:59:59', -- due date
        '', -- date deleted. do we care about date deleted?
        '<h1>This is a fake action that should not exist on the site </h1>
        <form class="ui form" action="/db/submitAction" method="POST" enctype="multipart/form-data">
            <label for="name">Name</label>
            <input name="name" type="text"/>

            <label for="email">Email</label>
            <input name="email" type="text"/>
       </form>
        ',
        '.png,.pdf,.jpg',
        5242880  -- 5MB file size limit
    ),
    (
        4,  -- semester (referencing semester_group)
        'Action 2',
        'admin',
        'This is the second test action for a project',
        '2025-01-23 12:00:00', -- start date
        '2025-05-19 11:59:59', -- due date
        '', -- date deleted. do we care about date deleted?
        '<h1>Peer Evaluation</h1>
          <form style="text-align: left;" class="ui form" action="/db/submitAction" method="POST" enctype="multipart/form-data">
            <h2>Instructions</h2>
            <p>
              Rate every member of the team, including yourself, in each category on a scale of 1 to 5.
              <br />
              <br />
              <b>Cooperation and Attitude: </b>being motivated and interested in working on the project. Working harmoniously with others to meet group responsibilities.
              <br />
              <br />
              <b>Quantity of Work:</b> Comparing the actual work output of the team member to the project. Quality of Work: Demonstrating accuracy, completeness, and neatness of work.
              <br />
              <br />
              <b>Initiative:</b> Planning work and going ahead with a task without being told every detail. Willingness to add own ideas to the project.
              <br />
              <br />
              <b>Dependability:</b> Being relied upon and trusted to handle work assignments. Work is completed on time.
              <br />
              <br />
              <b>Group Maintenance:</b> Contributing to the effective functioning of the team, i.e., utilizing interpersonal skills to manage conflicts, giving and taking directions, and using appropriate management skills to meet project tasks.

              <h2>Question Matrix Showcase</h2>
                <div>
                <QuestionTable questions=''["Cooperation and Attitude","Quantity of Work","Initiative"]'' scale=''5'' required=''false'' icon=''default'' selfFeedback=''false'' includeStudents=''true''/>
                </div>
                <br/>
                <h2>Question Mood Ratings Showcase</h2>
                <div>
                <QuestionMoodRating question="Dependability" levels=''["Not Dependable","Somewhat Dependable","Dependable","Very Dependable","Extremely Dependable"]'' required=''true'' selfFeedback=''false'' includeStudents=''true''/>
                </div>
                <br/>
                <div>
                <QuestionMoodRating question="Group Maintenance" levels=''["Extremely Dissatisfied","Dissatisfied","Neutral","Satisfied","Extremely Satisfied"]'' required=''false'' selfFeedback=''false'' includeStudents=''true''/>
                </div>
                <br/>
                <div>
                <QuestionFeedback title="Feedback" questions=''["Provide specific comments about any members or situations","Identify disputes or problems that happened and how they were handled.","Yap yap yap"]'' ordered=''true'' required=''false'' includeStudents=''false'' selfFeedback=''false'' />
                </div>
                <br/>
                <div>
                <QuestionPeerFeedback title="Question Title" questions=''["Cooperation and Attitude","Quantity of Work","Initiative"]'' required=''true'' selfFeedback=''false'' includeStudents=''true''/>
                </div>
                <br/>

            </p>
          </form>
    ',
        '',
        5242880  -- 5MB file size limit
    ),
    (
        4,  -- semester (referencing semester_group)
        'Action 3',
        'admin',
        'This is the third test action for a project',
        '2025-01-29 12:00:00', -- start date
        '2025-02-07 11:59:59', -- due date
        '', -- date deleted. do we care about date deleted?
        '<h1>Take the individual test form</h1>
        <form class="ui form" action="/db/submitAction" method="POST" enctype="multipart/form-data">
            <label for="name">Name</label>
            <input name="name" type="text"/>

            <label for="email">Email</label>
            <input name="email" type="text"/>
       </form>
        ',
        '.png,.pdf,.jpg',
        5242880  -- 5MB file size limit
    )
    
;
