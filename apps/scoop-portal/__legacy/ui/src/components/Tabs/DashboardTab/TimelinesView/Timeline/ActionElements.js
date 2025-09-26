import React, { useState } from 'react';
import ToolTip from "./ToolTip";
import { ACTION_STATES } from '../../../../util/functions/constants';
import _ from "lodash";

const adminIcon = '/admin.png';
const coachIcon = '/coach.png';
const studentIcon = '/student.png';
const teamIcon = '/team.png';
const subactionIcon = '/subactions.png';

export default function ActionElements(props) {

    //This is a helper function created in order to properly sort actions in a way such that sub actions are always next to parent actions
    const getNestedSortedActions = (actions) => {
        //initial sorting is kept in tact in order to maintain due date sorting 
        const sorted = _.sortBy(actions || [], ["start_date", "due_date",  "action_title"]);
        const actionMap = new Map();

    
        //loop through initial sorting
        sorted.forEach(action => {
            //if we find that the action map does NOT have a key for the current action's parent id:
            if (!actionMap.has(action.parent_id)) {
                //add a new key for the action's parent ID and give a value of an empty array for storing children afterwards
                actionMap.set(action.parent_id, []);
            }
            //add action as a value to the map where the key is said action's parent id
            actionMap.get(action.parent_id).push(action);
        });
    
        //final list of actions that will store the correct order
        const orderedActions = [];
    
        //function for adding actions to the final ordered array with children next to them
        const addWithChildren = (action) => {
            //add action to the ordered action list
            orderedActions.push(action);
            //get values at key action_id from actionMap, or empty array if there are no children
            const children = actionMap.get(action.action_id) || [];
            //recursively loop through this function until no children elements are left unsorted
            children.forEach(child => addWithChildren(child));
        };
    
        // Start with top-level actions (parent_id === 0 or null)
        (actionMap.get(0) || []).forEach(parentAction => {
            addWithChildren(parentAction);
        });
    
        return orderedActions;
    };

    const sortedActions = getNestedSortedActions(props.actions);
    let actionsComponents = [];
    const [visibleArr, setVisibleArr] = useState(Array(sortedActions.length).fill(true));

    function updateVisible(actionID) {
        const updatedVisibleArr = [...visibleArr];
    
        sortedActions.forEach((action, idx) => {
            if (sortedActions[actionID]?.action_id === sortedActions[idx]?.parent_id) {
                updatedVisibleArr[idx] = !updatedVisibleArr[idx];
                console.log('child found! visibleArr index: ' + updatedVisibleArr[idx] + ', index: ' + idx + ', sortedActions index: ' + sortedActions[idx]?.action_id + ', sortedActions parent id: ' + actionID);
            }
        });
    
        setVisibleArr(updatedVisibleArr);
        console.log(updatedVisibleArr);
    }


    const getRoleIcon = (target) => {
        switch(target) {
            case 'coach':
                return coachIcon;
            case 'individual':
                return studentIcon;
            case 'admin':
                return adminIcon;
            case 'team':
                return teamIcon;
            default:
                return null;
        }
    };

    const hasSubactions = (actionId) => {
        return sortedActions.some(action => action.parent_id === actionId);
    };
    
    

    sortedActions.forEach((action, idx) => {
        if (visibleArr[idx]) return;
        let color = "";
        if (sortedActions[idx]?.parent_id != 0) {
            color += "proposal-row-purple";
        } else {
        switch (action.state) {
            case ACTION_STATES.YELLOW:
                color += "proposal-row-yellow";
                break;
            case ACTION_STATES.RED:
                color += "proposal-row-red";
                break;
            case ACTION_STATES.GREEN:
                color += "proposal-row-green";
                break;
            case ACTION_STATES.GREY:
                color += "proposal-row-gray";
                break;
            default:
                color += `proposal-row-${action.state}`;
                break;
        }
    }

        const trigger = <button
            className={`action-bar ${color}`}
            key={idx}
            
            style={{ position: 'relative'}}
        >
            <div className="action-bar-text" title={action.action_title} style={{display: visibleArr[idx] ? 'block' : 'none'}}>{action.action_title} </div>
            {getRoleIcon(action.action_target) && (
                <img 
                    src={getRoleIcon(action.action_target)} 
                    alt={`${action.action_target} role`}
                    className="role-icon"
                    style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        objectFit: 'contain'
                    }}
                />
            )}
            {hasSubactions(action.action_id) && (
                <img 
                    onClick={()=>updateVisible(idx)}
                    src={subactionIcon} 
                    alt="Has subactions"
                    className="subaction-icon"
                    style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        objectFit: 'contain'
                        
                    }}
                    
                />
            )}
        </button>
        actionsComponents.push(
            <ToolTip
                autoLoadSubmissions={props.autoLoadSubmissions}
                color={color} noPopup={props.noPopup}
                trigger={trigger}
                action={action} projectId={props.projectId}
                semesterName={props.semesterName}
                projectName={props.projectName}
                key={`tooltip-${action.action_title}-${idx}`}
                reloadTimelineActions={props.reloadTimelineActions}
            />
        )
    })

    return <div className={props.noPopup ? "relevant-actions-container" : "actions-container"}>
        {actionsComponents}
    </div>
}
