import { Component, OnDestroy, OnInit } from "@angular/core";
import { Project } from "../project-policy-config/project";
import { Observable, Subject } from "rxjs/index";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ProjectService } from "../service/project.service";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ErrorHandler } from "../error-handler/error-handler";

@Component({
    selector: "hbr-image-name-input",
    templateUrl: "./image-name-input.component.html",
    styleUrls: ["./image-name-input.component.scss"]
})
export class ImageNameInputComponent implements OnInit, OnDestroy {
    noProjectInfo = "";
    selectedProjectList: Project[] = [];
    proNameChecker: Subject<string> = new Subject<string>();
    imageNameForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private errorHandler: ErrorHandler,
        private proService: ProjectService,
    ) {
        this.imageNameForm = this.fb.group({
            projectName: ["", Validators.required],
            repoName: ["", Validators.required],
            tagName: ["", Validators.required],
        });
    }
    ngOnInit(): void {
        this.proNameChecker
            .pipe(debounceTime(200))
            .pipe(distinctUntilChanged())
            .subscribe((name: string) => {
                this.noProjectInfo = "";
                this.selectedProjectList = [];
                const prolist: any = this.proService.listProjects(name, undefined);
                if (prolist.subscribe) {
                    prolist.subscribe(response => {
                        if (response) {
                            this.selectedProjectList = response.slice(0, 10);
                            // if input project name exist in the project list
                            let exist = response.find((data: any) => data.name === name);
                            if (!exist) {
                                this.noProjectInfo = "REPLICATION.NO_PROJECT_INFO";
                            } else {
                                this.noProjectInfo = "";
                            }
                        } else {
                            this.noProjectInfo = "REPLICATION.NO_PROJECT_INFO";
                        }
                    }, (error: any) => {
                        this.errorHandler.error(error);
                        this.noProjectInfo = "REPLICATION.NO_PROJECT_INFO";
                    });
                } else {
                    this.errorHandler.error("not Observable type");
                }
            });
    }

    get projectName(): AbstractControl {
        return this.imageNameForm.get("projectName");
    }

    get repoName(): AbstractControl {
        return this.imageNameForm.get("repoName");
    }

    get tagName(): AbstractControl {
        return this.imageNameForm.get("tagName");
    }

    ngOnDestroy(): void {
        if (this.proNameChecker) {
            this.proNameChecker.unsubscribe();
        }
    }

    validateProjectName(): void {
        let cont = this.imageNameForm.controls["projectName"];
        if (cont && cont.valid) {
            this.proNameChecker.next(cont.value);
        } else {
            this.noProjectInfo = "PROJECT.NAME_TOOLTIP";
        }
    }

    blurProjectInput(): void {
        this.validateProjectName();
    }

    leaveProjectInput(): void {
        this.selectedProjectList = [];
    }

    selectedProjectName(projectName: string) {
        this.imageNameForm.controls["projectName"].setValue(projectName);
        this.selectedProjectList = [];
        this.noProjectInfo = "";
    }
}
