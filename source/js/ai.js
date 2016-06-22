var ai_shapeXSize =0, ai_shapeYSize = 0, ai_shapeZSize = 0;
var ai_targetXPos=0, ai_targetYPos=0, ai_targetZPos=0;
var boardWidth = 0;
var boardDepth = 0;
var boardMaxHeight = 0;
var nearlyCompletedRemainingCubes = 2;
var maxThreeXThreeLandingAreasToKeep = 1;

self.addEventListener('message', function(e) {
    boardWidth = e.data.boardWidth; boardDepth = e.data.boardDepth; boardMaxHeight = e.data.boardMaxHeight;
    decideTargetLocation(e.data.csx, e.data.csy, e.data.csz, e.data.levels);
    self.postMessage({"targetXPos" : ai_targetXPos, "targetYPos" : ai_targetYPos, "targetZPos" : ai_targetZPos,
                     "shapeXSize" : ai_shapeXSize, "shapeYSize" : ai_shapeYSize, "shapeZSize" : ai_shapeZSize});
}, false);

function conv(x,y,z)
{
    return y * (boardWidth*boardDepth) + z * boardWidth + x;
}

function shapeCheck(levels, xsearch,ysearch,zsearch, tcsX,tcsY,tcsZ)
{
    // nothing up the top
    for (var xx = 0; xx < tcsX; xx++)
        for (var yy = 0; yy < boardMaxHeight-ysearch; yy++)
            for (var zz = 0; zz < tcsZ; zz++)
                if (levels[conv(xsearch+xx, ysearch+yy, zsearch+zz)]!= 0) return false;

    // something to land on
    if (ysearch == 0) return true;

    for (var xx = 0; xx < tcsX; xx++)
        for (var zz = 0; zz < tcsZ; zz++)
                if (levels[conv(xsearch+xx, ysearch-1, zsearch+zz)]!= 0) return true;

    return false;
}

function generateHeightMap(levels)
{
    var heightMap = new Array(boardWidth);
    for (var xxx = 0; xxx < boardWidth; xxx++)
    {
        heightMap[xxx] = new Array(boardDepth);
        for (var zzz = 0; zzz < boardDepth; zzz++)
        {
            heightMap[xxx][zzz] = -1;
            for (var yyy = boardMaxHeight-1; yyy >= 0; yyy--)
            {
                if (levels[conv(xxx,yyy,zzz)] != 0) {heightMap[xxx][zzz] = yyy; break; }
            }
        }
    }
    return heightMap;
}
function cloneHeightMap(inmap)
{
    var heightMap = new Array(boardWidth);
    for (var xxx = 0; xxx < boardWidth; xxx++)
    {
        heightMap[xxx] = new Array(boardDepth);
        for (var zzz = 0; zzz < boardDepth; zzz++)
        {
            heightMap[xxx][zzz] = inmap[xxx][zzz];
        }
    }
    return heightMap;
}

function countLandingAreas(heightMap, len, maxToCount)
{
    var landingAreas = 0;
    for (var xx = boardWidth - len; xx  >= 0; xx--)
        for (var zz = boardDepth - len; zz >= 0; zz--)
        {
            var pl = -100;
            var sameCount = 1;
            out: for (var xxx = 0; xxx < len; xxx++)
                for (var zzz = 0; zzz < len; zzz++)
                {
                    var l = heightMap[xxx+xx][zzz+zz];
                    if (pl == -100) pl = l;
                    else if (pl == l) sameCount ++;
                    else break out;
                }

            // 3x3 Landing area found
            if (sameCount == 9) {
                landingAreas++;
                //console.log("landing area found!");
                if (xx == boardWidth - len && zz == boardDepth - len) {
                    landingAreas ++;
                    //console.log("Corner landing area found!");
                    //printHeightMap(heightMap, "Corner landing area found!");
                }
                if (maxToCount <= landingAreas) return landingAreas;
            }
        }
    return landingAreas;
}

function heightMapAssesment(heightMap, print)
{
    var vals = [];
    //if (print) console.log("show: ------");
    for (var xx = 0; xx < boardWidth; xx++) {
        var row = "";
        for (var zz = 0; zz < boardDepth; zz++) {

            row = heightMap[xx][zz] + row;
            if (!vals[heightMap[xx][zz]])
                vals[heightMap[xx][zz]] = 1;
            else
                vals[heightMap[xx][zz]]++;
        }
       // if (print) console.log("show:" + row);
    }
    //if (print) console.log("show:" + "------");

    var median = 0;
    var highestCount = 0;
    for (var yy = 0; yy < boardMaxHeight; yy++)
    {
        if (vals[yy] && vals[yy] > highestCount)
        {
            highestCount = vals[yy];
            median = yy;
        }
    }

    //if (print) console.log("show: Median is: " + median);

    var score = 0;
    for (var xx = 0; xx < boardWidth; xx++)
        for (var zz = 0; zz < boardDepth; zz++) {
            var v = heightMap[xx][zz];
            var delta = v - median;
            if (delta < 0)
                score += 500 * (boardMaxHeight - (-delta));
            else if (delta > 3)
                score -= 1000 * delta;
            else
                score += 100 * (boardMaxHeight - delta);
        }

    score  += (boardMaxHeight - median) * 100000;

    //if (print) console.log("show: Score is:" + score);

    return score;
}

function printHeightMap(heightMap, prefix) {
    console.log(prefix + ": ------");
    for (var xx = 0; xx < boardWidth; xx++) {
        var row = "";
        for (var zz = 0; zz < boardDepth; zz++) {
            row = heightMap[xx][zz] + row;
        }
        console.log(prefix + ":" + row);
    }
    console.log(prefix + ":" + "------");
}

function heightMapAssesment2(heightMap, print)
{
    var score = 0;
    for (var xx = 1; xx < boardWidth-1; xx++)
        for (var zz = 1; zz < boardDepth-1; zz++) {

            var c, count = 1, val = [];
            for (var xxx = -1; xxx < 2; xxx++) {
                for (var zzz = -1; zzz < 2; zzz++)
                    if (xxx != 0 && zzz != 0) {
                        var v = heightMap[xx+xxx][zz+zzz];
                        if (val[v] == null)
                            val[v] = 1;
                        else
                            val[v]++;

                    }
            }

            var median = 0, medianCount = 0;
            for (var i = 0; i < boardMaxHeight; i++)
            {
                if (val[v] != null && val[v] >= medianCount)
                {
                    median = i; medianCount = val[v];
                }

            }

            if (medianCount == 8 || medianCount == 7 && median != heightMap[xx][zz])
            {
                score -= medianCount * medianCount * 100;
            }
        }

    for (var xx = 0; xx < boardWidth; xx++)
        for (var zz = 0; zz < boardDepth; zz++)
             score -= heightMap[xx][zz] * heightMap[xx][zz] * 100 + (boardWidth-xx) + (boardDepth-zz);

    //if (print) console.log("show: Score is:" + score);

    return score;
}

function decideTargetLocation(csx,csy,csz, levels)
{
    var heightMap = generateHeightMap(levels);
    //var landingAreasBefore = countLandingAreas(heightMap, 3 ,maxThreeXThreeLandingAreasToKeep);
    //var initialHeightMapScore = heightMapAssesment2(heightMap, true);
    var selectedSpot = "";

    var tcsX = 0, tcsY = 0, tcsZ = 0;
    ai_decisionMade = false;
    ai_targetYPos=0, ai_targetXPos=0, ai_targetYPos=0;
    var highestScore = null;
    for (var rotation = 0; rotation < 4; rotation ++)
    {
        tcsX = csx, tcsY = csy, tcsZ = csz;
        if (rotation == 1)
        {
            if (csx == csz) continue;
            tcsX = csz; tcsY = csy; tcsZ = csx;
        }
        else if (rotation == 2)
        {
            if (tcsY == tcsZ) continue;
            tcsX = csx; tcsY = csz; tcsZ = csy;
        }
        else if (rotation == 3)
        {
            if (tcsX == tcsY) continue;
            tcsX = csy; tcsY = csx; tcsZ = csz;
        }
        for (var xsearch = 0; xsearch < (boardWidth+1) - tcsX; xsearch++)
        {
            for (var zsearch = 0; zsearch < (boardDepth+1) - tcsZ; zsearch++)
            {
                for (var ysearch = 0; ysearch < (boardMaxHeight+1) - tcsY; ysearch++)
                {
                    if (!shapeCheck(levels, xsearch,ysearch,zsearch, tcsX,tcsY,tcsZ)) continue;

                    var uncovered = 0, covered = 0, totalspaces = 0;
                    if (ysearch != 0)
                    {
                        for (var yy = Math.max(0,ysearch-1); yy < ysearch; yy++)
                            for (var xx = 0; xx < tcsX; xx++)
                                for (var zz = 0; zz < tcsZ; zz++) {
                                    if (levels[conv(xsearch + xx, yy, zsearch + zz)] == 0)
                                        uncovered++;
                                    else
                                        covered++;
                                    totalspaces++;
                                }
                    }
                    else
                    {
                        totalspaces = tcsX*tcsY*1; covered = tcsX*tcsY*1; uncovered = 0;
                    }

                    //console.log("x:" + xsearch + " y:" + ysearch + " z:" + zsearch + " Covered: " + covered + " Uncovered: " + uncovered);

                    var completedLayers = 0, fullEdgesX = 0;
                    var nearlyCompletedLayers = 0, fullEdgesZ = 0;
                    for (var yy = 0; yy < tcsY; yy++)
                    {
                        var blockCount = 0;
                        for (var xx = 0; xx < boardWidth; xx++)
                            for (var zz = 0; zz < boardDepth; zz++)
                            {
                                if ((xx >= xsearch && xx < xsearch + tcsX && zz >= zsearch && zz < zsearch + tcsZ)
                                    || (levels[conv(xx,yy+ysearch,zz)] != 0))
                                    blockCount ++;

                                if (
                                    (xx == xsearch && (xx == 0 || levels[conv(xx-1,yy+ysearch,zz)] != 0))
                                    || (xx == xsearch+tcsX-1 && (xx == boardWidth-1 || levels[conv(xx+1,yy+ysearch,zz)] != 0)))
                                    fullEdgesX ++;
                                if (
                                    (zz == zsearch && (zz == 0 || levels[conv(xx,yy+ysearch,zz-1)] != 0))
                                    || (zz == zsearch+tcsZ-1 && (zz == boardDepth-1 || levels[conv(xx,yy+ysearch,zz+1)] != 0)))
                                    fullEdgesZ ++;

                            }
                        if (blockCount == boardWidth * boardDepth)
                            completedLayers ++;

                        if (blockCount == boardWidth * boardDepth - nearlyCompletedRemainingCubes)
                            nearlyCompletedLayers++;

                    }


                    // Lowest point strategy
                    //	score = completedLayers * 100000 + (boardMaxHeight-(ysearch)) * 10000 - 5000 * uncovered + nearlyCompletedLayers * 4000 + (fullEdgesX * 100 / tcsX) / tcsY + (fullEdgesZ * 100 / tcsZ) / tcsY;

                    /*
                    score = completedLayers * 100000 + (boardMaxHeight - ysearch+tcsY) * 10000 + (10000 * covered / totalspaces) + (tcsY == 1 ? 8000 :0) + nearlyCompletedLayers * 4000 + (fullEdgesX + fullEdgesZ) * 100 + (12-xsearch-zsearch);
                    // Keep landing areas for 3x3 shapes
                    if (!(tcsX == 3 && tcsZ == 3))
                    {
                        var heightMapWithShape = cloneHeightMap(heightMap);
                        // Draw shape
                        for (var xxx = xsearch; xxx < xsearch + tcsX; xxx++)
                            for (var zzz = zsearch; zzz < zsearch + tcsZ; zzz++)
                            {
                                if (heightMapWithShape[xxx])
                                    heightMapWithShape[xxx][zzz] = ysearch + tcsY - 1;
                            }
                        var landingAreasAfter = countLandingAreas(heightMapWithShape, 3, maxThreeXThreeLandingAreasToKeep);

                        //console.log("Landing areas before: " + landingAreasBefore + " after: " + landingAreasAfter);

                        if (landingAreasBefore != 0 && landingAreasAfter == 0)
                            score -= 20000;
                        else
                            score += 5000 * (landingAreasAfter - landingAreasBefore);
                    }*/

                    var heightMapWithShape = cloneHeightMap(heightMap);
                    // Draw shape
                    for (var xxx = xsearch; xxx < xsearch + tcsX; xxx++)
                        for (var zzz = zsearch; zzz < zsearch + tcsZ; zzz++)
                        {
                            heightMapWithShape[xxx][zzz] = ysearch + tcsY - 1;
                        }
                    score = heightMapAssesment2(heightMapWithShape)
                            + (tcsX == 3 && tcsZ == 3 && uncovered != 0? 0 : countLandingAreas(heightMapWithShape, 3, maxThreeXThreeLandingAreasToKeep)  * 2000)
                            - (uncovered / totalspaces) * 10000
                            + (nearlyCompletedLayers) * 100000;
                            + (completedLayers) * 1000000;

                    // Do not cover strategy
                    //score = completedLayers * 1000000 + (covered * 100000) / (covered + uncovered) + (boardMaxHeight-(ysearch+tcsY)) * 1000 + Math.abs(trX-3) * Math.abs(trZ-3);

                    // Calculate actual position
                    if (highestScore == null || highestScore<score)
                    {
                      /*
                        selectedSpot = "("+ score+") Completed Layers: " + completedLayers + " height factor " + (boardMaxHeight - ysearch+tcsY) * 10000 + " covered: " + covered + " total: " + totalspaces
                            + " landing before:" + landingAreasBefore + " landing after:" + landingAreasAfter + " nearly completed: " + nearlyCompletedLayers + " fullEdgeX: " +fullEdgesX + " fullEdgeZ: " + fullEdgesZ + " xx: " + xx + " zz:" + zz + "\n"
                            + "Previous: " + selectedSpot;
                            */
                        //console.log("Location accepted: " + xsearch + "," + zsearch + "," + ysearch);
                        //console.log("Uncovered: " + uncovered);
                        highestScore = score;
                        ai_targetXPos = (xsearch * 50) - 150 + (25 * tcsX);
                        ai_targetYPos = (ysearch * 50) - 300 + (25 * tcsY);
                        ai_targetZPos = (zsearch * 50) - 150 + (25 * tcsZ);
                        ai_shapeXSize = tcsX;
                        ai_shapeYSize = tcsY;
                        ai_shapeZSize = tcsZ;
                    }
                }
            }
        }
    }
    //console.log("We have decided to place shape at: " + ai_targetXPos + ", " + ai_targetYPos + ", " + ai_targetZPos + "  " + ai_shapeXSize + ", " + ai_shapeYSize + ", " + ai_shapeZSize);
    //console.log("Decision based on: " + selectedSpot);
    //scene.add(newCube(ai_targetXPos, ai_targetYPos, ai_targetZPos, ai_shapeXSize, ai_shapeYSize, ai_shapeZSize));
}
